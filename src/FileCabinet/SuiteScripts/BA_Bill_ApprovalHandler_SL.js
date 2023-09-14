/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/workflow', 'N/runtime'],
    function(record, workflow, runtime) {
        function onRequest(context) {
            try{
                if (context.request.method === 'GET') {
                    var vendorBillId = context.request.parameters.vbid;
                    var action = context.request.parameters.action;
                    var userId = context.request.parameters.id;

                    // Load the script parameters
                    var secondApprover = runtime.getCurrentScript().getParameter({name: 'custscript_second_approver'});
                    var superApprover = runtime.getCurrentScript().getParameter({name: 'custscript_super_approver'});
    
                    // Load the vendor bill
                    var vb = record.load({
                        type: record.Type.VENDOR_BILL,
                        id: vendorBillId
                    });
    
                    // Check if the current user is the next approver
                    var approverId = vb.getValue({fieldId: 'nextapprover'});
                    if (userId !== approverId) {
                        context.response.write("You're not authorized to approve this vendor bill.");
                        return;
                    }

                    // Identify the approval limit
                    var vbTotal = parseFloat(vb.getValue({fieldId: 'total'}));
                    var approvalLimit = 0;
                    var isSuperApprover = false;
                    if (userId === secondApprover) {
                        approvalLimit = 50000;
                    } else if (userId === superApprover) {
                        approvalLimit = 0;
                        isSuperApprover = true;
                    } else {
                        approvalLimit = 25000;
                    }
                    
                    if (action === 'approve') {
                        if (vbTotal <= approvalLimit || isSuperApprover) {
                            workflow.trigger({
                                recordType: record.Type.VENDOR_BILL,
                                recordId: vendorBillId,
                                workflowId: 'customworkflow_ba_vb_approval_wf',
                                actionId: 'workflowaction689'
                            });
                            context.response.write("You have successfully approved the Vendor Bill.");
                        } else {
                            workflow.trigger({
                                recordType: record.Type.VENDOR_BILL,
                                recordId: vendorBillId,
                                workflowId: 'customworkflow_ba_vb_approval_wf',
                                actionId: 'workflowaction688'
                            });
                            context.response.write("The Vendor Bill total exceeds your approval limit. It has been sent to the next approver.");
                        }
                    } else if (action === 'reject') {
                        workflow.trigger({
                            recordType: record.Type.VENDOR_BILL,
                            recordId: vendorBillId,
                            workflowId: 'customworkflow_ba_vb_approval_wf',
                            actionId: 'workflowaction691'
                        });
                        context.response.write("You have successfully rejected the Vendor Bill.");
                    } else {
                        context.response.write("Invalid action. Please specify either 'approve' or 'reject'.");
                    }
                }
            }
            catch(e){
                log.error('Error', e);
                context.response.write("Invalid action. Please specify either 'approve' or 'reject'.");
            }
        }

        return {
            onRequest: onRequest
        };
    });