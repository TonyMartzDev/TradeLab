// Sidebar
const sidebar = document.querySelector(".sidebar");


// Sidebar Collapse Menu
document.addEventListener("DOMContentLoaded", () => {
  // Initialize sidebar state
  const isMobile = window.innerWidth <= 992;
  const savedState = localStorage.getItem("sidebarState");

  // Add toggle button to sidebar
  const toggleButton = document.createElement("button");
  toggleButton.className = "sidebar-toggle";
  toggleButton.innerHTML = `<i class="fas fa-chevron-${
    isMobile ? "right" : "left"
  }"></i>`;
  sidebar.appendChild(toggleButton);

  // Set initial state
  if (savedState === "collapsed" || (isMobile && savedState !== "expanded")) {
    sidebar.classList.add("collapsed");
  }

  // Toggle sidebar function
  function toggleSidebar() {
    sidebar.classList.toggle("collapsed");
    localStorage.setItem(
      "sidebarState",
      sidebar.classList.contains("collapsed") ? "collapsed" : "expanded"
    );
  }

  // Add click event listener to toggle button
  toggleButton.addEventListener("click", toggleSidebar);

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const wasCollapsed = sidebar.classList.contains("collapsed");
      const newIsMobile = window.innerWidth <= 992;

      // Will reset classes when switching between mobile and desktop
      if (isMobile !== newIsMobile) {
        if (newIsMobile && !wasCollapsed) {
          sidebar.classList.add("collapsed");
        }
      }
    }, 300);
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 992 &&
        !sidebar.contains(event.target) &&
        !sidebar.classList.contains('collapsed')
    ) {
        sidebar.classList.add('collapsed');
        localStorage.setItem("sidebarState", "collapsed");
    }
  })
});
