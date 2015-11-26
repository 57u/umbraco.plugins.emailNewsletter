# umbraco.plugins.emailNewsletter


A handful of files will be required, and also some particular directory structures.

Here's the structure for my Email Newsletter Plug-in, we'll then go through how to create each file and it's contents.

Directory Structure



So, as you can see we have:

package.manifest
EmailNewsletter.css
EmailNewsletter.controller.js (our Angular controller)
SendEmailController.cs (our c# controller)
/actions/EmailNewsletter.html (our Angular view)
The actions directory is required, and is part of the naming convention we need to follow for our files to be found.

Lets look at each file:

Inside the package.manifest we have a simple object referencing our css and js files:

{
 css: [
 '~/App_Plugins/EmailNewsletter/BackOffice/EmailNewsletter.css'
 ], 
 javascript: [
 '~/App_Plugins/EmailNewsletter/BackOffice/EmailNewsletter.controller.js'
 ] 
}
The css file just contains our css, we don't need to show that here.

In the JavaScript file, is our Angular Controller, this contains the functions and logic i wrote to provide some feedback to the user.

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

        /* Only show $emailValidText if checkbox is ticked */
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
                /* Controller is sending this JSON back serialized & escaped. I need to parse this twice, why? */
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
The Angular View, or action, is in /actions/EmailNewsletter.html and looks like this:

<div class="ngViewWrap">

    <div ng-controller="EmailNewsletter.EmailNewsletterController">
        <div class="umb-dialog-body form-horizontal">
            <div class="umb-pane">

                <h4>Confirm &amp; Send</h4>
                <div id="emailNewsletter_DefaultContent">
                    <p>After making sure all your content is perfect and looks great in a browser, simply press the send button below.</p>
                    <p>You can also tick the checkbox to send yourself a test first.</p>
                      <hr/>
                      <label for="testSendEmailSwitch"><strong>Send a test email?</strong></label>
                      <input type="checkbox" id="testSendEmail_Switch" name="testSendEmail_Switch" value="true" />
                      <input type="email" id="testSendEmail_Input" name="testSendEmail_Input" placeholder="Enter email address" disabled="disabled" />
                      <span id="emailValidText" class=""></span>
                      <hr/>
                    <p>

                    <button ng-click="sendEmailNewsletter()" type="submit" class="btn btn-lg btn-warning"
                               name="sendEmailNewsletter" id="sendEmailNewsletter">Send Newsletter</button>
                </div>

                <div ng-bind-html="newsletterEmailStatus" id="newsletterEmailStatus"></div>

            </div>
        </div>
        <div class="umb-dialog-footer btn-toolbar umb-btn-toolbar">
            <a class="btn btn-link" ng-click="nav.hideDialog()">
                <localize key="general_cancel">Cancel</localize>
            </a>
        </div>
    </div>

</div>
The C# Controller does a few things: it receives our newsletter ID, fetches the content, validates a few bits, sends the email, and returns some JSON to our Angular controller...

/**
    Stuart Sillitoe
    2015
    Pro:Direct Sport

    SendEmail Controller
    - Sends email to test user or to the group.
*/

using Newtonsoft.Json;
using System;
using System.IO;
using System.Net.Mail;
using System.Text;
using System.Web;
using Umbraco.Core.Models;
using Umbraco.Web;
using Umbraco.Web.WebApi;

namespace cfBlog3.App_Plugins.EmailNewsletter
{

    public class ReturnJSON
    {
        public string status {get; set;}
        public string message {get; set;}
    }


    public class PostedData
    {
        public bool sendTestEmail { get; set; }
        public string sendToAddress { get; set; }
        public int newsletterEpisodeId { get; }
    }


    [Umbraco.Web.Mvc.PluginController("EmailNewsletter")]
    public class SendEmailController: UmbracoAuthorizedApiController
    {
        private string resultMessage;
        private string resultStatus;
        private string sendToAddress;

        [System.Web.Http.HttpGet]
        [System.Web.Http.HttpPost]
        public string SendEmail( int id ) 
        {
            /* Parse the posted body string for our JSON object */
            string body = null;
            using ( StreamReader reader = new StreamReader(HttpContext.Current.Request.InputStream) )
            {
                body = reader.ReadToEnd();
            }
            PostedData postedData = JsonConvert.DeserializeObject<PostedData>(body);

            /* If testing is true, send to the entered test email address */
            if ( postedData.sendTestEmail && postedData.sendToAddress != String.Empty )
            {
                sendToAddress = postedData.sendToAddress;
            }
            else
            {
                sendToAddress = "stuart@vericode.co.uk"; /* this will be the all@prodirectsport.net group (and should be set on a config file or via backend maybe?) */
            }

            UmbracoHelper umbracoHelper = new UmbracoHelper(UmbracoContext.Current);

            IPublishedContent newsletter = umbracoHelper.Content(id);
            if ( newsletter != null )
            {
                string emailSubject = newsletter.GetPropertyValue("emailSubject").ToString();
                string emailContent = newsletter.GetPropertyValue("emailContent").ToString();
                string newsletterURL = newsletter.UrlAbsolute();

                if ( emailSubject == String.Empty || emailContent == String.Empty )
                {
                    resultStatus = "error";
                    resultMessage = "<strong>Email Subject or Content is empty.</strong> Please fix this before you are able to send the newsletter.";
                }
                else
                {
                    var msg = new MailMessage();
                    msg.To.Add(new MailAddress(sendToAddress));
                    msg.From = new MailAddress("stuart.sillitoe@prodirectsport.net", "Stuart");
                    msg.Subject = emailSubject;
                    msg.IsBodyHtml = true;
                    
                    emailContent = emailContent.Replace(Environment.NewLine, "<br/>");

                    StringBuilder emailTemplate = new StringBuilder( System.IO.File.ReadAllText(HttpContext.Current.Server.MapPath("~/App_Plugins/EmailNewsletter/BackOffice/views/Email.cshtml")) );
                   
                    string emailBody = emailTemplate.ToString()
                                .Replace("{{emailContent}}", emailContent)
                                .Replace("{{newsletterURL}}", newsletterURL);

                    msg.Body = emailBody;

                    using ( SmtpClient smtp = new SmtpClient() )
                    {
                        smtp.Send(msg);
                        resultStatus = "success";
                        resultMessage = "Email has been sent successfully.";
                    }
                }
            }


            ReturnJSON result = new ReturnJSON
            {
                status = resultStatus,
                message = resultMessage
            };


            return JsonConvert.SerializeObject(result);

        }
    }
}