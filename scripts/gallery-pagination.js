// 갤러리 썸네일을 페이지 단위로 나눠 보여주고, 하단 페이지 번호로 이동한다
(function (root, factory) {
    const pagination = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = pagination;
    }

    if (root) {
        root.GalleryPagination = pagination;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const PER_PAGE = 12;

    function buildPageCount(total, perPage) {
        if (total <= 0 || perPage <= 0) {
            return 1;
        }

        return Math.max(1, Math.ceil(total / perPage));
    }

    function resolvePageForIndex(index, perPage) {
        if (perPage <= 0) {
            return 0;
        }

        return Math.floor(Math.max(0, index) / perPage);
    }

    // 페이지가 적으면 전부 나열하고, 많으면 처음/끝 + 현재 주변만 보여주고
    // 나머지는 하나의 생략(...)으로 묶는다
    function buildPageNumbersModel(currentPage, pageCount) {
        const WINDOW = 1;
        const pages = [];

        for (let page = 0; page < pageCount; page += 1) {
            pages.push(page);
        }

        if (pageCount <= 7) {
            return pages.map(function (page) {
                return {type: "page", page: page, isActive: page === currentPage};
            });
        }

        const keep = new Set([0, pageCount - 1, currentPage]);
        for (let offset = 1; offset <= WINDOW; offset += 1) {
            keep.add(currentPage - offset);
            keep.add(currentPage + offset);
        }

        const model = [];
        let previousKept = -1;

        pages.forEach(function (page) {
            if (!keep.has(page)) {
                return;
            }

            if (previousKept !== -1 && page - previousKept > 1) {
                model.push({type: "ellipsis"});
            }

            model.push({type: "page", page: page, isActive: page === currentPage});
            previousKept = page;
        });

        return model;
    }

    function buildPageNumbersMarkup(model) {
        return model.map(function (entry) {
            if (entry.type === "ellipsis") {
                return '<span class="gallery-page-ellipsis" aria-hidden="true">&hellip;</span>';
            }

            const label = entry.page + 1;
            const activeAttr = entry.isActive ? ' aria-current="page"' : "";

            return '<button class="gallery-page-number' + (entry.isActive ? " is-active" : "") +
                '" data-page="' + entry.page + '" type="button"' + activeAttr + ">" + label + "</button>";
        }).join("");
    }

    const NOOP = {
        ensurePageVisible: function () {}
    };

    function initPagination(config) {
        if (typeof document === "undefined") {
            return NOOP;
        }

        const grid = document.querySelector(config.gridSelector);
        const nav = document.querySelector(config.paginationSelector);
        const numbers = document.querySelector(config.numbersSelector);

        if (!grid || !nav || !numbers) {
            return NOOP;
        }

        const thumbs = Array.from(grid.children);
        const perPage = config.perPage || PER_PAGE;
        const pageCount = buildPageCount(thumbs.length, perPage);

        if (thumbs.length <= perPage) {
            return NOOP;
        }

        let currentPage = 0;

        function render() {
            const start = currentPage * perPage;
            const end = start + perPage;

            thumbs.forEach(function (thumb, index) {
                thumb.hidden = index < start || index >= end;
            });

            numbers.innerHTML = buildPageNumbersMarkup(buildPageNumbersModel(currentPage, pageCount));

            const firstButton = nav.querySelector('[data-page-action="first"]');
            const prevButton = nav.querySelector('[data-page-action="prev"]');
            const nextButton = nav.querySelector('[data-page-action="next"]');
            const lastButton = nav.querySelector('[data-page-action="last"]');

            if (firstButton) {
                firstButton.disabled = currentPage === 0;
            }
            if (prevButton) {
                prevButton.disabled = currentPage === 0;
            }
            if (nextButton) {
                nextButton.disabled = currentPage === pageCount - 1;
            }
            if (lastButton) {
                lastButton.disabled = currentPage === pageCount - 1;
            }
        }

        function goToPage(page) {
            currentPage = Math.min(Math.max(page, 0), pageCount - 1);
            render();
        }

        nav.addEventListener("click", function (event) {
            const numberButton = event.target.closest("[data-page]");
            if (numberButton) {
                goToPage(Number(numberButton.dataset.page));
                return;
            }

            const actionButton = event.target.closest("[data-page-action]");
            if (!actionButton) {
                return;
            }

            const action = actionButton.dataset.pageAction;

            if (action === "first") {
                goToPage(0);
            } else if (action === "prev") {
                goToPage(currentPage - 1);
            } else if (action === "next") {
                goToPage(currentPage + 1);
            } else if (action === "last") {
                goToPage(pageCount - 1);
            }
        });

        nav.hidden = false;
        render();

        return {
            ensurePageVisible: function (index) {
                goToPage(resolvePageForIndex(index, perPage));
            }
        };
    }

    return {
        PER_PAGE,
        buildPageCount,
        resolvePageForIndex,
        buildPageNumbersModel,
        buildPageNumbersMarkup,
        initPagination
    };
}));
