
document.addEventListener("DOMContentLoaded", () => {
    const followButton = document.getElementById("follow-btn")

    followButton.addEventListener("click",handleFollow)
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
const followCsrftoken = getCookie('csrftoken');

function handleFollow() {
    fetch("/following", {
        method: "PUT", 
        body: JSON.stringify({id: this.dataset.id}),
        headers: {"X-CSRFToken": followCsrftoken},
        mode: "same-origin" // Do not send CSRF token to another domain.
    })
    .then(response => response.json())
    .then(data => {
        this.textContent = data["button_content"]
        this.parentNode.querySelector("#total-followers").textContent = data["total_followers"]
    })
    .catch(error => console.log(error));
}