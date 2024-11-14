// Load the content from content.html into the #content section
document.addEventListener("DOMContentLoaded", function () {
    fetch("content.html")
        .then(response => response.text())
        .then(data => {
            document.getElementById("content").innerHTML = data;
        })
        .catch(error => console.error("Error loading content:", error));
});
