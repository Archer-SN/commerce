
document.addEventListener("DOMContentLoaded", () => {
    const likePostButtons = document.getElementsByClassName("like-post-btn");
    // Url for dealing with likes
    const postUrl  = "/post";
    const commentUrl = "/comment";

    for (let i = 0; i < likePostButtons.length; i++) {
        likePostButtons[i].addEventListener("click", (e) => handleLike(e, postUrl))
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
const likeCsrftoken = getCookie('csrftoken');

function handleLike(e, url) {
    console.log(e.target.dataset.id);
    fetch(url, {
        method: "PUT", 
        body: JSON.stringify({id: e.target.dataset.id}),
        headers: {"X-CSRFToken": likeCsrftoken},
        mode: "same-origin" // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        e.target.parentNode.querySelector(".like-count").textContent = data["like_count"];
    })
    .catch(error => console.log(error));
}

