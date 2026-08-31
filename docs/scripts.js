document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const navbarLinks = document.querySelectorAll(".navbar a[data-page]");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    // Mobile menu toggle
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("show");
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
                if (window.innerWidth <= 860) {
                    navLinks.classList.remove("show");
                    menuToggle.setAttribute("aria-expanded", "false");
                }
            });
        });
    }

    // Function to initialize dynamic Table of Contents on documentation page
    function initTableOfContents() {
        const tocList = document.getElementById("docsTocList");
        if (!tocList) return;

        const headings = content.querySelectorAll(".docs-body h2, .docs-body h3");
        if (headings.length === 0) return;

        tocList.innerHTML = "";
        headings.forEach((heading, idx) => {
            if (!heading.id) {
                heading.id = "section-" + (heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || idx);
            }

            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent.replace(/^#+\s*/, "");
            if (heading.tagName.toLowerCase() === "h3") {
                a.style.paddingLeft = "20px";
                a.style.fontSize = "0.82rem";
            }

            a.addEventListener("click", (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, null, `#${heading.id}`);
            });

            li.appendChild(a);
            tocList.appendChild(li);
        });

        // Scroll spy with IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    tocList.querySelectorAll("a").forEach(link => {
                        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
                    });
                }
            });
        }, { rootMargin: "-100px 0px -60% 0px" });

        headings.forEach(h => observer.observe(h));
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
                window.scrollTo({ top: 0, behavior: "instant" });

                // Update active navbar link
                navbarLinks.forEach((link) => {
                    link.classList.remove("active");
                    if (link.getAttribute("data-page") === page) {
                        link.classList.add("active");
                    }
                });

                // Update URL without reload
                const newUrl = page === "home" ? window.location.pathname : `${window.location.pathname}?page=${page}`;
                window.history.pushState({ page }, "", newUrl);

                // Initialize TOC if on docs page
                if (page === "spot_documentation") {
                    initTableOfContents();
                }

                // Re-bind internal links with data-page
                content.querySelectorAll("a[data-page]").forEach(link => {
                    link.addEventListener("click", (e) => {
                        e.preventDefault();
                        const p = link.getAttribute("data-page");
                        if (p) loadPage(p);
                    });
                });
            })
            .catch((error) => {
                console.error("Error loading page:", error);
                content.innerHTML = `
                    <div style="text-align: center; padding: 60px 20px;">
                        <h2>Page Not Found</h2>
                        <p style="color: #94a3b8; margin: 10px 0 20px 0;">The requested page could not be loaded.</p>
                        <a href="?page=home" data-page="home" class="cta-primary">Return to Home</a>
                    </div>
                `;
            });
    }

    // Handle initial page load
    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = urlParams.get("page") || "home";
    loadPage(initialPage);

    // Handle navigation clicks
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
    window.addEventListener("popstate", (e) => {
        const urlParams = new URLSearchParams(window.location.search);
        const page = (e.state && e.state.page) || urlParams.get("page") || "home";
        loadPage(page);
    });
});
