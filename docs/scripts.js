document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const navbarLinks = document.querySelectorAll(".navbar a[data-page]");

    // Load the default page (home)
    loadPage("pages/home.html");

    // Attach click event listeners to navigation links
    navbarLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault(); // Prevent default anchor behavior
            const page = link.getAttribute("data-page");
            loadPage(`pages/${page}.html`);
        });
    });

    // Function to load the requested page into the content section
    function loadPage(pageUrl) {
        fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Could not load ${pageUrl}`);
                }
                return response.text();
            })
            .then(html => {
                content.innerHTML = html;
            })
            .catch(error => {
                console.error("Error loading page:", error);
                content.innerHTML = `<p>Error loading content. Please try again later.</p>`;
            });
    }
});
