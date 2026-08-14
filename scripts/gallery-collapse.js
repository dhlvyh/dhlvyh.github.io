// 갤러리 썸네일이 일정 장수를 넘으면 나머지를 접고 더보기 버튼으로 펼친다
(function (root, factory) {
    const collapse = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = collapse;
    }

    if (root) {
        root.GalleryCollapse = collapse;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const DEFAULT_LIMIT = 30;

    // "이상"이 아니라 "초과"다. 총 장수가 한도와 같으면 숨길 게 없어서
    // "더보기 (0장)"이라는 무의미한 버튼만 생긴다.
    function shouldCollapse(total, limit) {
        return total > limit;
    }

    function countHidden(total, limit) {
        return shouldCollapse(total, limit) ? total - limit : 0;
    }

    function buildToggleLabel(hiddenCount, expanded) {
        return expanded ? "접기" : "더보기 (" + hiddenCount + "장)";
    }

    // 접을 필요가 없거나 엘리먼트를 못 찾으면 이걸 돌려준다.
    // 호출부가 null 검사를 하지 않아도 되게 한다.
    const NOOP = {
        ensureIndexVisible: function () {
        }
    };

    function initCollapse(config) {
        if (typeof document === "undefined") {
            return NOOP;
        }

        const grid = document.querySelector(config.gridSelector);
        const wrapper = document.querySelector(config.wrapperSelector);
        const toggle = document.querySelector(config.toggleSelector);

        if (!grid || !wrapper || !toggle) {
            return NOOP;
        }

        // 썸네일은 DOM에서 빼지 않고 hidden만 건다. gallery-viewer가
        // thumbGrid.children의 인덱스로 활성 썸네일을 추적하기 때문에
        // 순서나 개수가 바뀌면 매핑이 통째로 어긋난다.
        const thumbs = Array.from(grid.children);
        const limit = config.limit || DEFAULT_LIMIT;

        if (!shouldCollapse(thumbs.length, limit)) {
            return NOOP;
        }

        const hiddenCount = countHidden(thumbs.length, limit);
        const label = toggle.querySelector("[data-collapse-label]") || toggle;
        let expanded = false;

        function render() {
            thumbs.forEach(function (thumb, index) {
                thumb.hidden = !expanded && index >= limit;
            });

            toggle.setAttribute("aria-expanded", String(expanded));
            label.textContent = buildToggleLabel(hiddenCount, expanded);
            wrapper.classList.toggle("is-expanded", expanded);
        }

        function expand() {
            if (expanded) {
                return;
            }

            expanded = true;
            render();
        }

        function collapse() {
            expanded = false;
            render();

            // 펼친 채로 한참 내려간 뒤 접으면 그리드가 화면 위로 사라져서
            // 페이지가 튄 것처럼 보인다. 그럴 때만 되돌린다.
            if (grid.getBoundingClientRect().top < 0) {
                grid.scrollIntoView({block: "start", behavior: "smooth"});
            }
        }

        toggle.addEventListener("click", function () {
            if (expanded) {
                collapse();
            } else {
                expand();
            }
        });

        wrapper.hidden = false;
        render();

        return {
            // 메인 뷰어가 숨은 사진으로 이동하면 썸네일 활성 표시가 보이지
            // 않으므로 자동으로 펼친다.
            ensureIndexVisible: function (index) {
                if (index >= limit) {
                    expand();
                }
            }
        };
    }

    return {DEFAULT_LIMIT, shouldCollapse, countHidden, buildToggleLabel, initCollapse};
}));
