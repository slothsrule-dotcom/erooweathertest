
document.addEventListener("DOMContentLoaded", () => {

    console.log("animation.js loaded");

    // PAGE TRANSITIONS
    const links = document.querySelectorAll("nav a");
    const transition = document.querySelector(".transition-container");

    console.log("Found links:", links.length);

    links.forEach(link => {
        link.addEventListener("click", e => {
            // Allow external links and new-tab navigation
            if (
                e.ctrlKey ||
                e.metaKey ||
                e.shiftKey ||
                e.altKey ||
                link.target === "_blank" ||
                new URL(link.href).origin !== window.location.origin
            ) {
                return;
            }

            e.preventDefault();

            const target = link.href;

            if (transition) {
                transition.classList.add("active");
            }

            setTimeout(() => {
                window.location.href = target;
            }, 800);
        });
    });


    // MOBILE NAVIGATION
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        function closeMenu() {
            navLinks.classList.remove("open");
            menuToggle.classList.remove("open");

            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");

            document.body.style.overflow = "";
        }

        menuToggle.addEventListener("click", () => {

            const open = navLinks.classList.toggle("open");

            menuToggle.classList.toggle("open", open);

            menuToggle.setAttribute("aria-expanded", open);
            menuToggle.setAttribute(
                "aria-label",
                open ? "Close navigation" : "Open navigation"
            );

            document.body.style.overflow = open ? "hidden" : "";

        });

        // Close when selecting a link
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", closeMenu);
        });

        // Close with Escape
        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

    } else {
        console.warn("Mobile navigation elements not found.");
    }

});


// PAGE LOAD ANIMATION
window.addEventListener("load", () => {
    document.body.classList.add("loaded");
});
