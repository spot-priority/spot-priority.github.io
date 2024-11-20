document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const navbarLinks = document.querySelectorAll(".navbar a[data-page]");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    // Collapsible menu toggle
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("show");
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

    // Function to decorate active page
    function decorateNavbarLinks(activePage) {
        // Active page decoration
        navbarLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("data-page") === activePage) {
                link.classList.add("active");
            }
        });
    }

    // Function to handle page navigation and loading
    function handlePage(pageUrl, activePage) {
        loadPage(pageUrl);
        decorateNavbarLinks(activePage);
    }

    // Check for query parameter on page load
    const params = new URLSearchParams(window.location.search);
    const page = params.get("page");
    if (page) {
        handlePage(`pages/${page}.html`, page);
    } else {
        // Default page (home)
        handlePage("pages/home.html", "home");
    }

    // Attach click event listeners to navigation links
    navbarLinks.forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault(); // Prevent default anchor behavior
            const page = link.getAttribute("data-page");
            handlePage(`pages/${page}.html`, page);

            // Update the browser's URL without reloading
            history.pushState({}, "", `?page=${page}`);
        });
    });

    // Handle browser back/forward navigation
    window.addEventListener("popstate", () => {
        const params = new URLSearchParams(window.location.search);
        const page = params.get("page") || "home";
        handlePage(`pages/${page}.html`, page);
    });
});
