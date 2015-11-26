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
            // Parse the posted body string for my json object
            string body = null;
            using ( StreamReader reader = new StreamReader(HttpContext.Current.Request.InputStream) )
            {
                body = reader.ReadToEnd();
            }
            PostedData postedData = JsonConvert.DeserializeObject<PostedData>(body);

            // If testing is true, send to the entered test email address 
            if ( postedData.sendTestEmail && postedData.sendToAddress != String.Empty )
            {
                sendToAddress = postedData.sendToAddress;
            }
            else
            {
                sendToAddress = "stuart@vericode.co.uk"; // this will be the all@prodirectsport.net group (and should be set on a config file or via backend maybe?)
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