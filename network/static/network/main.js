
document.addEventListener("DOMContentLoaded", () => {
    // Adding Events to like buttons 
    const likePostButtons = document.getElementsByClassName("like-post-btn");
    for (let i = 0; i < likePostButtons.length; i++) {
        likePostButtons[i].addEventListener("click", (e) => handleLike(e, "post"));
    }

    // Adding Events to follow buttons
    const followButton = document.getElementById("follow-btn");
    if (typeof(followButton) != 'undefined' && followButton != null) {
        followButton.addEventListener("click", handleFollow);
    }
    

    // Adding Events to edit buttons
    const editPostButtons = document.getElementsByClassName("edit-post-btn");
    for (let i = 0; i < editPostButtons.length; i++) {
        editPostButtons[i].addEventListener("click", (e) => handleEdit(e, "post"))
    }

    // Adding Events to comment buttons
    const commentButtons = document.getElementsByClassName("comment");
    for (let i = 0; i < commentButtons.length; i++) {
        commentButtons[i].addEventListener("click", showComment, {once: true})
    }

})

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

function handleLike(e, type) {
    fetch("/like", {
        method: "PUT", 
        body: JSON.stringify({id: e.target.dataset.id, type: type}),
        headers: {"X-CSRFToken": csrftoken},
        mode: "same-origin" // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(data => {
        e.target.style.color = data.color;
        e.target.parentNode.querySelector(".like-count").textContent = data["like_count"];
    })
    .catch(error => window.location.replace("/login"));
}

function handleFollow() {
    fetch("/following", {
        method: "PUT", 
        body: JSON.stringify({id: this.dataset.id}),
        headers: {"X-CSRFToken": csrftoken},
        mode: "same-origin" // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(data => {
        this.textContent = data["button_content"];
        this.parentNode.querySelector("#total-followers").textContent = data["total_followers"];
    })
    .catch(error => console.log(error));
}

function handleEdit(e, type) {
    let url;
    if (type === "post") {
        url = "/post";
    } 
    else if (type === "comment") {
        url = "/comment";
    } 
    else {
        alert("Error!");
        return;
    }

    // Will be used to later replace the edit form
    const contentContainer = e.target.parentNode;
    const content = contentContainer.querySelector(".content").textContent;
    const clonedContentContainer = contentContainer.cloneNode(true);
    const clonedEditButton = clonedContentContainer.querySelector(`.edit-${type}-btn`)

    const editContainer = document.createElement("div");
    editContainer.className = "py-3"

    const editArea = document.createElement("textarea");
    editArea.value = content;
    editArea.className = "form-control mb-3";
    

    const submitButton = document.createElement("button");
    submitButton.className = "btn btn-primary btn-sm mr-2";
    submitButton.textContent = "Edit"
    submitButton.addEventListener("click", () => {
        editContent = editArea.value;
        fetch(url, {
            method: "PUT", 
            body: JSON.stringify({id: contentContainer.dataset.id, content: editContent}),
            headers: {"X-CSRFToken": csrftoken},
            mode: "same-origin" // Do not send CSRF token to another domain.
        })
        .then(response => response.json())
        .then(data => {
            clonedContentContainer.querySelector(".content").textContent = data.new_content;
            // Events don't get cloned so we have to add them ourselves
            clonedEditButton.addEventListener("click", (e) => handleEdit(e, type))
            editContainer.replaceWith(clonedContentContainer);
        })
    })

    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-light btn-sm";
    cancelButton.textContent = "Cancel"
    cancelButton.addEventListener("click", () => {
        editContainer.replaceWith(clonedContentContainer);
        clonedEditButton.addEventListener("click", (e) => handleEdit(e, type))
    })

    editContainer.append(editArea, submitButton, cancelButton);

    contentContainer.replaceWith(editContainer);
}

function showComment(e) {
    const commentButton = e.target;
    const postId = commentButton.dataset.id;

    const commentContainer = document.createElement("div");
    commentContainer.className = "comment-container"
    // Hide comments on click
    commentButton.addEventListener("click", (e) => hideComment(e), { once: true })

    const hr = document.createElement("hr");
    const commentForm = createCommentForm(postId);
    commentContainer.append(hr, commentForm)
    
    fetch(`/comment?id=${postId}`, {
        headers: {"X-CSRFToken": csrftoken},
        mode: "same-origin" // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(data => {
        if (data["is_logged_in"] === false) {
            commentForm.action = "/login";
            commentForm.method = "GET"
        }
        const commentData = data.comments;
        for (let i = 0; i < commentData.length; i++) {
            commentContainer.append(createComment(data["user_id"], commentData[i]))
        }
        // If no comment has been created
        if (commentData.length == 0) {
            commentContainer.append("No post yet.");
        }
        commentButton.parentNode.append(commentContainer);
    })
    .catch(error => console.log(error))
}

function hideComment(e) {
    e.target.parentNode.querySelector(".comment-container").remove()
    e.target.addEventListener("click", (e) => showComment(e), {once: true})
}


function createComment(userId, comment) {
    console.log(userId, comment);
    const newComment = document.createElement("div");

    const hr = document.createElement("hr");

    const profileLink = document.createElement("a");
    profileLink.className = "h5";
    profileLink.textContent = comment["author_username"];
    profileLink.setAttribute("href", `profile/${comment.author_id}`);

    const contentContainer = document.createElement("div");
    contentContainer.className = "content-container";
    contentContainer.dataset.id = comment.id;

    const content = document.createElement("p");
    content.className = "content";
    content.textContent = comment.content;

    contentContainer.append(content);

    const dateCreated = document.createElement("p");
    dateCreated.className = "date-created text-muted" 
    dateCreated.textContent = comment["date_created"];

    const likeButton = document.createElement("i");
    likeButton.className = "bi bi-heart-fill like-comment-btn";
    likeButton.dataset.id = comment.id;
    likeButton.addEventListener("click", (e) => handleLike(e, "comment"))

    const likeCount = document.createElement("p");
    likeCount.className = "like-count";
    likeCount.textContent = comment.likes;

    const commentButton = document.createElement("p");
    commentButton.className = "comment text-muted";
    commentButton.dataset.id = comment.id;

    newComment.append(hr, profileLink, contentContainer)

    if (comment.author_id === userId) {
        const editButton = document.createElement("p");
        editButton.className = "edit-comment-btn";
        editButton.textContent = "Edit";
        
        contentContainer.prepend(editButton);
        editButton.addEventListener("click", (e) => handleEdit(e, "comment"))
    }

    newComment.append(dateCreated, likeButton, likeCount, commentButton);

    return newComment;
}

function createCommentForm(postId) {
    // Creating form for adding comments
    const commentForm = document.createElement("form");
    commentForm.action = "/comment";
    commentForm.setAttribute("method", "POST");
    
    const hiddenCsrftoken = document.createElement("input")
    hiddenCsrftoken.type = "hidden";
    hiddenCsrftoken.value = csrftoken;
    hiddenCsrftoken.name = 'csrfmiddlewaretoken';

    const hiddenPostId = document.createElement("input")
    hiddenPostId.type = "hidden";
    hiddenPostId.value = postId;
    hiddenPostId.name = 'post-id';

    const commentArea = document.createElement("textarea");
    commentArea.placeholder = "Write Comment..";
    commentArea.rows = 3;
    commentArea.name = "content";
    commentArea.className = "form-control mb-3"

    const commentSubmit = document.createElement("input");
    commentSubmit.type = "submit";
    commentSubmit.value = "Comment"; 
    commentSubmit.className = "btn btn-primary btn-sm"
    
    commentForm.append(hiddenCsrftoken, hiddenPostId, commentArea, commentSubmit);
    return commentForm;
}