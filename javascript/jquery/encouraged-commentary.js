/**
* Encouraged Commentary - A comment traverser to help manage conversations on web pages.
* Copyright (c) 2009 Jim Jeffers - jim(at)donttrustthisguy(dot)com | http://donttrustthisguy.com
* Dual licensed under MIT and GPL.
* Date: 1/09/2009
* @author Jim Jeffers
* @version 1.0
*
* Intro Article:
* http://donttrustthisguy.com/2009/01/04/encouraged-commentary/ 
*
* Source:
* http://github.com/jimjeffers/encouraged-commentary/tree/master
*/

$(document).ready( function() {   
   //
   // Text highlighted comments.
   //
   $(document.body).append("<span id=\"comment-respond\">Respond</span>");
   var widget = $('#comment-respond');
   widget.css('position','absolute');
   widget.fadeTo(10,0);

   var permalink = "";
   var author = "";
   var quote = "";
   
   $('.commentlist > .comment, .quotable').each( function() {
      $(this).mouseup(function(e){
         widget.css('top',e.pageY+10);
         widget.css('left',e.pageX+10);
         if(getSelText()) {
            widget.show();
            widget.fadeTo("normal",0.3);
            var comment = findCommentFor(e.target);
            if(comment) {
               permalink = findPermalinkFor(comment).href;
               author = findAuthorFor(comment).text;
            } else {
               permalink = false;
               author = false;
            }
            quote = getSelText();
         }
      });
   });
   
   widget.hover(
      function() {
         $(this).fadeTo("fast",1);
      },
      function() {
         $(this).fadeTo("fast",0.3);
      }
   );
   
   widget.mousedown(function(e){
      var directive = "";
      if(permalink && author) {
         directive = "<p><a href=\""+permalink+"\">@"+author+"</a>:</p>\n"
      }
      $('#comment').val(directive+"<blockquote>"+quote+"</blockquote>\n<p>\n<!-- Start your comment below this line. -->\n\n</p>");
      $.scrollTo('#comment', {duration: 1000});
      $(this).fadeTo(1,0);
      widget.hide();
   });
   
   $(document.body).mousedown(function(){
      widget.hide();
   });
   
   $('.commentlist .comment a').click(function(e){
      var anchor = getAnchor(this.href);
      if($('.commentlist '+anchor).length > 0) {
         setCurrentComment(anchor);
         $.scrollTo(anchor, {duration: 1000});
         return false;
      }
   });
   
   //
   // Comment traversing utilities :: related comments & replies trick.
   //
   var commentList = $($('.commentlist').get(0));
   var relatedComments = new Array();
   var relatedReplies = new Array();
   var sortedCommentary = commentList.hasClass('sorted-commentary');
   $('.commentlist .comment p:first-child a:first-child').each(function() { 
      if(this.text.substring(1,-1) == "@") {
         var targetAuthor = this.text.substring(1,this.text.length);
         var replyComment = findCommentFor(this);
         var replyAuthor = findAuthorFor(replyComment);
         var replyPermalink = findPermalinkFor(replyComment);
         var targetAnchor = getAnchor(this.href);
         var reference = '<a href="'+replyPermalink.href+'">'+replyAuthor.innerHTML+'</a>';
         
         // Sorting / Response handling.
         var parentComment = $('.commentlist #'+targetAnchor.substr(1,targetAnchor.length));
         if(parentComment.length > 0 && sortedCommentary){
            $(parentComment.get(0)).after(replyComment.addClass('response'));
         }
         
         if(!relatedReplies[targetAnchor]) {
            relatedReplies[targetAnchor] = new Array(reference);
         } else {
            relatedReplies[targetAnchor][relatedReplies[targetAnchor].length] = reference;
         }
      }
   });
   
   var quoteReplyControls = '';
   if(!commentList.hasClass('no-quote-control')) {
      quoteReplyControls += '<a href="#" class="comment-quote">Quote</a>'
   }
   if(!commentList.hasClass('no-reply-control')) {
      quoteReplyControls += '<a href="#" class="comment-reply">Reply</a>'
   }
   $('.commentlist > .comment').each( function() {
      var currentAuthor = findAuthorFor(this); // 'this' is a comment.
      var currentPermalink = findPermalinkFor(this);
      var currentAnchor = getAnchor(currentPermalink.href);
      var reference = '<a href="'+currentPermalink.href+'">'+currentPermalink.innerHTML+'</a>';
      if(!relatedComments[currentAuthor.text]) {
         relatedComments[currentAuthor.text] = new Array(reference);
      } else {
         relatedComments[currentAuthor.text][relatedComments[currentAuthor.text].length] = reference;
      }
      $(this).append('<div class="comment-controls">'+quoteReplyControls+'</div>');
      $(this).find('.comment-reply, .comment-quote').each( function() {
         if($(this).hasClass('comment-reply')) { $(this).click(function(e){ setupComment(this,false); return false; }); }
         if($(this).hasClass('comment-quote')) { $(this).click(function(e){ setupComment(this,true); return false; }); }
      });
      var commentControlsTimeout = false;
      var commentControls = $($(this).find('.comment-controls'));
      commentControls.hide();
      $(this).hover(
         function(){
            if(relatedComments[currentAuthor.text].length > 1 || relatedReplies[currentAnchor]) {
               if($(this).find('div.comment-controls div.related-replies, div.comment-controls div.related-comments').length < 1) {
                  if(relatedReplies[currentAnchor] && !commentList.hasClass('no-replies')){
                     var wording = "";
                     (relatedReplies[currentAnchor].length > 1) ? wording = "replies" : wording = "reply";
                     commentControls.append('<div class="related-replies"><h6>'+(relatedReplies[currentAnchor].length)+' '+wording+' to this comment</h6><ol>'+printReplies(relatedReplies[currentAnchor])+'</ol></div>');
                  }
                  if(relatedComments[currentAuthor.text].length > 1 && !commentList.hasClass('no-relatives')){
                     var wording = "";
                     (relatedComments[currentAuthor.text].length-1 > 1) ? wording = "comments" : wording = "comment";
                     commentControls.append('<div class="related-comments"><h6>'+(relatedComments[currentAuthor.text].length-1)+' other '+wording+' from '+currentAuthor.text+'</h6><ol>'+printRelatives(relatedComments[currentAuthor.text],reference)+'</ol></div>');
                  }
                  $(this).find('div.comment-controls ol li a').click(function(e){
                     var anchor = getAnchor(this.href);
                     setCurrentComment(anchor);
                     $.scrollTo(anchor, {duration: 1000});
                     return false;
                  });
               }
            }
            // Add a delay to the mouseover so we don't trigger comment controls off like crazy.
            // This would read easier if we could come up with a good jQuery plugin to handle delay() 
            // and clearing timeouts.
            if(!commentControls.is(':visible') && !commentControlsTimeout) {
               commentControlsTimeout = setTimeout(function(){
                  commentControls.fadeIn("fast");
                  commentControlsTimeout = false; // Clear the timeout variable when the function completes.
               }, 300);
            } else {
               clearTimeout(commentControlsTimeout);
               commentControlsTimeout = false;
            }
         },
         function(){
            // Again more time out fun on mouse out.
            if(!commentControls.is(':visible') && commentControlsTimeout) {
               clearTimeout(commentControlsTimeout);
               commentControlsTimeout = false;
            } else if(commentControls.is(':visible') && !commentControlsTimeout) {
               commentControlsTimeout = setTimeout(function(){
                  commentControls.fadeOut("fast");
                  commentControlsTimeout = false;
               }, 500);  
            }
         });
   });
});

/*
   FUNCTION:
   findCommentFor(HTML element)
   Loops up through parent elements until it reaches a comment container.
   Automatically dies if the target was a 'quotable' container.
*/
function findCommentFor(el) {
   el = $(el);
   while(!el.hasClass('comment')) {
      if(el.hasClass('quotable')) {
         return false;
      }
      el = $(el.parent());
   }
   return el;
};

/*
   FUNCTION:
   FindPermaLinkFor(HTML element)
   Returns a permalink for the specified element.
*/
function findPermalinkFor(el){
   return $(el).find('.comment-permalink').get(0);
};

/*
   FUNCTION:
   FindAuthorFor(HTML element)
   Returns a the author of the specified element.
*/
function findAuthorFor(el){
   return $(el).find('.comment-author-name').get(0);
};

/*
   FUNCTION:
   PrintRelatives(array(HTML objects), htmlObject)
   Prints relative comments and appends a class to the current item.
*/
function printRelatives(relatives,current){
   var out = "";
   var liClass = "";
   for (var i = 0; i <= relatives.length - 1; i++){
      (relatives[i] == current) ? liClass = "current" : liClass = "";
      out += '<li class="'+liClass+'">'+relatives[i]+'</li>';
   };
   return out;
};

/*
   FUNCTION:
   PrintReplies(array(HTML objects))
   Prints replies to a specific comment.
*/
function printReplies(replies){
   var out = "";
   for (var i = 0; i <= replies.length - 1; i++){
      out += '<li>'+replies[i]+'</li>';
   };
   return out;
};

/*
   FUNCTION:
   PrintReplies(string)
   Resets current comment and appends class to the supplied comment id..
*/
function setCurrentComment(id) {
   $('.commentlist .current-comment').removeClass('current-comment');
   $($('.commentlist '+id).get(0)).addClass('current-comment');
};

/*
   FUNCTION:
   GetAnchor(string)
   Retrieves anchor from a given URL.
*/
function getAnchor(href){
   return '#'+href.split("#")[1];
};

/*
   FUNCTION:
   SetupComment(HTML object, string)
   Sets up a comment body in the comment form based off the target.
   - This method is used by the automated respond or quote buttons. 
   - The text highlight and respond works slightly differently.
*/
function setupComment(target,quote) {
   var comment = findCommentFor(target);
   var directive = '<p><a href="'+findPermalinkFor(comment).href+'">@'+findAuthorFor(comment).text+'</a></p>';
   if(quote) {
      quote = "<blockquote>";
      if(comment.find('.entry-content > p').length > 0) {
         comment.find('.entry-content > p').each(function() {
            var directivePresent = false;
            if($(this).find("a:first-child").length > 0) {
               if($(this).find("a:first-child").get(0).text.substring(1,-1) == "@") {
                  directivePresent = true;
               }
            }
            if(!directivePresent) {
               quote += "<p>"+this.innerHTML+"</p>"
            }
         });
      } else {
         quote = comment.innerHTML;
      }
      quote += "</blockquote>";
      quote = quote.replace("\n<!-- Start your comment below this line. -->\n\n",""); // Would be better implemented with regex?
      quote = quote.replace("\n<!-- Start your comment below this line. -->\n","");
      quote = quote.replace("<!-- Start your comment below this line. -->","");
   } else {
      quote = "";
   }
   $('#comment').val(directive+quote+"\n<p>\n<!-- Start your comment below this line. -->\n\n</p>");
   $.scrollTo('#comment', {duration: 1000});
};

/*
   FUNCTION:
   GetSelText()
   Grabs the text that is currently selected.
   
   Slightly modified from original source: 
   Jeff Anderson (9/1/2006)
   http://www.codetoad.com/javascript_get_selected_text.asp
*/
function getSelText()
{
   var txt = '';
   if (window.getSelection)
   {
      txt = window.getSelection();
   } else if (document.getSelection) {
      txt = document.getSelection();
   } else if (document.selection) {
      txt = document.selection.createRange().text;
   } else return;
   if(String(txt).length > 2) {
      txt = String(txt).replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br/>");
      return "<p>"+txt+"</p>";
   } else {
      return false;
   }
};