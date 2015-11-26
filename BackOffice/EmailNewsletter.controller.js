/**
    Stuart Sillitoe
    2015
    Pro:Direct Sport

    Email Newsletter Controller
    - Displays form options for sending test email
    - Validates email
    - Ensures email input when test is selected

*/

;
angular.module('umbraco').controller("EmailNewsletter.EmailNewsletterController", contentEmailNewsletterController);

function contentEmailNewsletterController($scope, $routeParams, $http, contentResource, notificationsService)
{
    var newsletterEpisodeId = $routeParams.id;
    $scope.newsletterEpisodeId = newsletterEpisodeId;

    var $defaultContent = $('#emailNewsletter_DefaultContent');
    var $testSendEmailSwitch = $('#testSendEmail_Switch');
    var $testSendEmailInput = $('#testSendEmail_Input');
    var $sendEmailButton = $('#sendEmailNewsletter');
    var $emailValidText = $('#emailValidText');

    var sendTestEmail = false;
    var postData = {};


    /**
        On change of checkbox
        - Enable or disable the email input
        - Show/Hide $emailvalidText
        - Set sendTestEmail (bool)
    */
    $testSendEmailSwitch.on('change', function ()
    {
        changeButtonState();

        $testSendEmailInput.prop('disabled', !$(this).prop('checked'));
        sendTestEmail = $(this).prop('checked');
        
        // Only show $emailValidText if checkbox is ticked
        $emailValidText.css('display', (sendTestEmail ? 'inline-block' : 'none'));

    });



    /**
        On Keyup of Email Input
        - Ensure valid email address
        - Adds text feedback for user 
        - Calls changeButtonState()
    */
    $testSendEmailInput.on('keyup', function()
    {
        var valid = changeButtonState();

        $emailValidText
            .html('email is ' + (valid ? '' : 'in') + 'valid')
            .removeClass()
            .addClass('text-' + (valid ? 'success' : 'error'))
        ;
        
    });



    /**
        Is Email Valid
        - Return (bool) 
        - Test is email is valid
    */
    var emailIsValid = function(email)
    {
        return email.match(/^[a-z0-9]+[a-z0-9._]+@[a-z]+\.[a-z.]{2,5}$/);
    };



    /**
        Change disabled state of submit button 
        - Disabled if they tick "send test" and don't enter a valid email address
        - Returns (bool) state
    */
    var changeButtonState = function()
    {
        var state = true;
        if (sendTestEmail && $testSendEmailInput.val() != "")
        {
            state = emailIsValid($testSendEmailInput.val());
        }

        $sendEmailButton.prop('disabled', !state);

        return state;

    };



    /**
        On click (ng-click in view)
        - Check if we are sending a test, then post off to our SendEmailController
    */
    $scope.sendEmailNewsletter = function ()
    {
        var sendToAddress = (sendTestEmail ? $testSendEmailInput.val() : "Everyone @ Pro:Direct");

        if (confirm("Send " + (sendTestEmail ? 'a test ' : '') + "email to " + sendToAddress + "\n\nSend It?"))
        {
            sendingText = "Sending " + (sendTestEmail ? 'Test ' : '') + "Email to " + sendToAddress;

            $scope.newsletterEmailStatus = '<p class="alert alert-info"><span class="busy pull-left"></span> <span class="newsletterEmailStatus_Text">' + sendingText + '</span></p>';

            postData = {
                "sendTestEmail": sendTestEmail,
                "newsletterEpisodeId": newsletterEpisodeId,
                "sendToAddress": sendToAddress
            };

            $defaultContent.hide();

            $http.post("/Umbraco/BackOffice/EmailNewsletter/SendEmail/SendEmail/" + newsletterEpisodeId, postData).then(function (response)
            {
                // Controller is sending this JSON back serialized & escaped. I need to parse this twice, why?
                var r = JSON.parse(JSON.parse(response.data));

                $scope.newsletterEmailStatus = '<p class="alert alert-' + r.status + '">' + r.message + '</p>';

                notificationsService.success("Success", r.message);          

            });
        }
        else
        {
            $scope.newsletterEmailStatus = '<p class="text-error">Cancelled - Email Not Sent</p>';
            notificationsService.info("Warning", "Cancelled - Email Not Sent");
        }

    };

}
;