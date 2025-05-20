document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const navbarLinks = document.querySelectorAll(".navbar a[data-page]");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    // Mobile menu toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("show");
            // Toggle aria-expanded for accessibility
            const isExpanded = navLinks.classList.contains("show");
            menuToggle.setAttribute("aria-expanded", isExpanded);
        });

        // Close menu when clicking outside
        document.addEventListener("click", (event) => {
            if (!event.target.closest(".navbar") && navLinks.classList.contains("show")) {
                navLinks.classList.remove("show");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove("show");
                    menuToggle.setAttribute("aria-expanded", "false");
                }
            });
        });
    }

    // Function to load the requested page into the content section
    function loadPage(page) {
        const pagePath = `pages/${page}.html`;
        fetch(pagePath)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Page not found");
                }
                return response.text();
            })
            .then((html) => {
                content.innerHTML = html;
                // Update active link
                navbarLinks.forEach((link) => {
                    link.classList.remove("active");
                    if (link.getAttribute("data-page") === page) {
                        link.classList.add("active");
                    }
                });
                // Update URL without reload
                const newUrl = page === "home" ? window.location.pathname : `${window.location.pathname}?page=${page}`;
                window.history.pushState({ page }, "", newUrl);
            })
            .catch((error) => {
                console.error("Error loading page:", error);
                content.innerHTML = "<h2>Page not found</h2><p>The requested page could not be loaded.</p>";
            });
    }

    // Handle initial page load
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get("page") || "home";
    loadPage(page);

    // Handle navigation
    navbarLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const page = link.getAttribute("data-page");
            if (page) {
                loadPage(page);
            }
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener("popstate", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get("page") || "home";
        loadPage(page);
    });
});
