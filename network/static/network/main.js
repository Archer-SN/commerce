
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
        e.target.parentNode.querySelector(".like-count").textContent = data["like_count"];
    })
    .catch(error => console.log(error));
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

    const editAreaDiv = document.createElement("div");
    const editArea = document.createElement("textarea");
    editArea.value = content;
    
    editAreaDiv.append(editArea);

    const submitButton = document.createElement("button");
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
    cancelButton.addEventListener("click", () => {
        editContainer.replaceWith(clonedContentContainer);
        clonedEditButton.addEventListener("click", (e) => handleEdit(e, type))
    })

    editContainer.append(editAreaDiv, submitButton, cancelButton);

    contentContainer.replaceWith(editContainer);
}