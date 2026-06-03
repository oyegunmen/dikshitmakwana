const contentDiv = document.getElementById('content');

function setActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkPage = link.getAttribute('data-page');
        if (linkPage === page || (page === '' && linkPage === 'home')) {
            link.classList.add('active');
        }
    });
}
 
function initHamburger() {
    const toggle = document.getElementById('nav-toggle');
    const menu   = document.getElementById('nav-menu');
    if (!toggle || !menu) return;
 
    toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open);
        toggle.classList.toggle('is-open', open);
    });
 
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('nav-open');
            toggle.setAttribute('aria-expanded', false);
            toggle.classList.remove('is-open');
        });
    });
}

function getHashParams() {
    const hash = window.location.hash.replace('#', '');
    const parts = hash.split('/');
    const page = parts[0] || 'home';
    const parameter = parts[1] || '';
    return { page, parameter };
}

function fetchMarkdown(url) {
    return fetch(url).then(res => {
        if (!res.ok) throw new Error();
        return res.text();
    });
}

function fetchIndex() {
    return fetch('./blog/index.json').then(res => res.json());
}

function renderBlogList(blogs, container, limit = null, currentPage = 1, itemsPerPage = 10) {
    let listHtml = '<div class="blog-list">';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = limit ? Math.min(limit, blogs.length) : startIndex + itemsPerPage;
    const paginatedBlogs = limit ? blogs.slice(0, endIndex) : blogs.slice(startIndex, endIndex);

    paginatedBlogs.forEach(blog => {
        const dateObj = new Date(blog.date);
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const year = dateObj.getFullYear();
        const formattedDate = `${month} ${year}`;

        listHtml += `
            <div class="blog-item hstack">
                <div class="date-section align-center vstack">
                    <span class="date">${day}</span>
                    <span class="month-year">${formattedDate}</span>
                </div>
                <div class="mb-4">
                    <a href="#post/${blog.slug}" class="blog-title"><h4 class="title">${blog.title}</h4></a>
                    <p class="blog-excerpt">${blog.excerpt}</p>
                    <a href="#post/${blog.slug}" class="read-more">Read More →</a>
                </div>
            </div>
        `;
    });

    listHtml += '</div>';

    if (!limit && blogs.length > itemsPerPage) {
        const totalPages = Math.ceil(blogs.length / itemsPerPage);

        let paginationHtml = `<nav aria-label="Pagination" class="mt-6 mb-4 align-center">
            <menu class="buttons">`;

        if (currentPage > 1) {
            paginationHtml += `<li><a class="button outline small" onclick="window.setPage(${currentPage - 1})" href="javascript:void(0)">&larr; Previous</a></li>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                paginationHtml += `<li><a class="button small" aria-current="page" href="javascript:void(0)">${i}</a></li>`;
            } else {
                paginationHtml += `<li><a class="button outline small" onclick="window.setPage(${i})" href="javascript:void(0)">${i}</a></li>`;
            }
        }

        if (currentPage < totalPages) {
            paginationHtml += `<li><a class="button outline small" onclick="window.setPage(${currentPage + 1})" href="javascript:void(0)">Next &rarr;</a></li>`;
        }

        paginationHtml += `</menu></nav>`;
        listHtml += paginationHtml;
    }

    container.innerHTML += listHtml;

    if (limit) {
        container.innerHTML += `
            <div class="view-all-wrap align-center mt-6 mb-4">
                <a href="/#blog" class="view-all-btn"><button>View All Posts →</button></a>
            </div>
        `;
    }
}

function renderPostFooter(blogMeta) {
    let tagsHtml = '';
    if (blogMeta && blogMeta.tags && blogMeta.tags.length > 0) {
        const tagLinks = blogMeta.tags
            .map(tag => `<a href="#blog?tag=${encodeURIComponent(tag)}" class="badge outline">${tag}</a>`)
            .join('');
        tagsHtml = `<div class="post-tags">${tagLinks}</div>`;
    }

    return `
        <div class="post-footer mt-6">
            <ul class="post-footer-notes">
                <li>100% human written, including emdashes. Damn it AI.</li>
                <li>This post is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</li>
            </ul>
            ${tagsHtml}
        </div>
    `;
}

function router() {
    let { page, parameter } = getHashParams();
    let activeTag = '';

    if (page.includes('?tag=')) {
        const query = page.split('?tag=');
        page = query[0];
        activeTag = decodeURIComponent(query[1]);
    }

    setActiveNav(page);
    contentDiv.innerHTML = 'Loading...';

    if (page === 'home' || page === '') {
        Promise.all([fetchMarkdown('./index.md'), fetchIndex()])
            .then(([md, blogs]) => {
                contentDiv.innerHTML = marked.parse(md);
                const sortedBlogs = blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
                contentDiv.innerHTML += '<h2 class="mb-6">Blog Posts</h2>';
                renderBlogList(sortedBlogs, contentDiv, 5);
            })
            .catch(() => { contentDiv.innerHTML = 'Error loading homepage.'; });

    } else if (page === 'blog') {
        fetchIndex()
            .then(blogs => {
                contentDiv.innerHTML = '<h2 class="mb-4">Musings</h2><p class="mb-6">An assorted collection of thoughts on Engineering, Technology, and my personal Life.</p>';
                let filteredBlogs = blogs.sort((a, b) => new Date(b.date) - new Date(a.date));

                if (activeTag) {
                    filteredBlogs = filteredBlogs.filter(b => b.tags && b.tags.includes(activeTag));
                    contentDiv.innerHTML += `<div class="filter-status mb-6 gap-6">Filtering by tag: <strong>${activeTag}</strong> <a href="#blog">Clear</a></div>`;
                }

                window.setPage = function (pageNumber) {
                    const existingList = contentDiv.querySelector('.blog-list');
                    const existingPagination = contentDiv.querySelector('nav[aria-label="Pagination"]');
                    if (existingList) existingList.remove();
                    if (existingPagination) existingPagination.remove();
                    renderBlogList(filteredBlogs, contentDiv, null, pageNumber);
                    const navHeight = document.querySelector('.navbar').offsetHeight;
                    const top = contentDiv.getBoundingClientRect().top + window.scrollY - navHeight - 24;
                    window.scrollTo({ top, behavior: 'smooth' });
                };

                window.setPage(1);
            })
            .catch(() => { contentDiv.innerHTML = 'Error loading blog Entry.'; });

    } else if (page === 'post' && parameter) {
        Promise.all([fetchMarkdown(`./blog/${parameter}.md`), fetchIndex()])
            .then(([md, blogs]) => {
                const blogMeta = blogs.find(b => b.slug === parameter);
                contentDiv.innerHTML =
                    `<div class="mb-4"><a href="#blog" class="back-link">← Back to Blog</a></div>` +
                    `<div class="post-content">${marked.parse(md)}</div>` +
                    renderPostFooter(blogMeta);
            })
            .catch(() => { contentDiv.innerHTML = 'Post not found.'; });

    } else if (page === 'projects') {
        fetchMarkdown('./projects.md')
            .then(md => {
                contentDiv.innerHTML = `<div class="page-content">${marked.parse(md)}</div>`;
            })
            .catch(() => { contentDiv.innerHTML = 'Error loading projects page.'; });

    } else if (page === 'personal') {
        fetchMarkdown('./personal.md')
            .then(md => {
                contentDiv.innerHTML = `<div class="page-content">${marked.parse(md)}</div>`;
            })
            .catch(() => { contentDiv.innerHTML = 'Error loading personal page.'; });

    } else {
        contentDiv.innerHTML = '<p>Page not found.</p>';
    }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', () => {
    initHamburger();
    router();
});