// 갤러리 메인 뷰어 — full-bleed 스와이프 트랙을 드래그와 버튼으로 무한 순환 탐색한다
(function (root, factory) {
    const gallery = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = gallery;
    }

    if (root) {
        root.GalleryViewer = gallery;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    function initGallery(config) {
        if (typeof document === "undefined" || typeof window === "undefined" || !window.GalleryUtils) {
            return;
        }

        const viewport = document.querySelector(config.viewportSelector);
        const track = document.querySelector(config.trackSelector);
        const prev = document.querySelector(config.prevSelector);
        const next = document.querySelector(config.nextSelector);
        const counter = config.counterSelector
            ? document.querySelector(config.counterSelector)
            : null;
        const progressFill = config.progressFillSelector
            ? document.querySelector(config.progressFillSelector)
            : null;

        if (!viewport || !track) {
            return;
        }

        const slides = Array.from(track.children);
        const length = slides.length;

        if (length === 0) {
            return;
        }

        let activeIndex = 0;
        let dragState = null;

        function setTrackPosition(index, dragDeltaX, useTransition) {
            const slideWidth = viewport.clientWidth;
            const translateX = (-index * slideWidth) + dragDeltaX;

            track.classList.toggle("is-animating", useTransition);
            track.style.transform = "translateX(" + translateX + "px)";
        }

        function updateNavButtons() {
            if (prev) {
                prev.disabled = length <= 1;
            }

            if (next) {
                next.disabled = length <= 1;
            }
        }

        function updateCounter() {
            if (counter) {
                counter.textContent = (activeIndex + 1) + " / " + length;
            }
        }

        function updateProgress() {
            if (progressFill) {
                progressFill.style.transform = "scaleX(" + ((activeIndex + 1) / length) + ")";
            }
        }

        // 마지막→처음, 처음→마지막으로 넘어가는 순간만 감지한다. 다음에 보여줄
        // 슬라이드가 화면에 없으므로(클론 슬라이드를 두지 않음) 이 경우에만
        // 트랜지션 없이 즉시 위치를 점프시키고, 그 외에는 평소처럼 애니메이션한다.
        function isWrapJump(fromIndex, toIndex) {
            return (fromIndex === length - 1 && toIndex === 0) || (fromIndex === 0 && toIndex === length - 1);
        }

        function goToIndex(index, useTransition) {
            const wrapped = isWrapJump(activeIndex, index);

            activeIndex = index;
            setTrackPosition(activeIndex, 0, useTransition && !wrapped);
            updateCounter();
            updateProgress();
        }

        function getPoint(event) {
            return {x: event.clientX, y: event.clientY};
        }

        function beginDrag(event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }

            const point = getPoint(event);
            dragState = {
                startX: point.x,
                lastX: point.x,
                lastTime: Date.now(),
                velocityX: 0,
                dragDeltaX: 0
            };
            track.classList.remove("is-animating");
            track.classList.add("is-dragging");

            if (track.setPointerCapture && event.pointerId !== undefined) {
                track.setPointerCapture(event.pointerId);
            }
        }

        function updateDrag(event) {
            if (!dragState) {
                return;
            }

            if (event.cancelable) {
                event.preventDefault();
            }

            const point = getPoint(event);
            const rawDeltaX = point.x - dragState.startX;
            const isPastFirst = activeIndex === 0 && rawDeltaX > 0;
            const isPastLast = activeIndex === length - 1 && rawDeltaX < 0;
            const dragDeltaX = isPastFirst || isPastLast
                ? window.GalleryUtils.applyEdgeResistance(rawDeltaX)
                : rawDeltaX;
            const now = Date.now();
            const elapsed = Math.max(now - dragState.lastTime, 1);

            dragState.velocityX = (point.x - dragState.lastX) / elapsed;
            dragState.lastX = point.x;
            dragState.lastTime = now;
            dragState.dragDeltaX = dragDeltaX;
            setTrackPosition(activeIndex, dragDeltaX, false);
        }

        function endDrag() {
            if (!dragState) {
                return;
            }

            const nextIndex = window.GalleryUtils.resolveSnapIndex(
                activeIndex,
                dragState.dragDeltaX,
                dragState.velocityX,
                viewport.clientWidth,
                length
            );

            track.classList.remove("is-dragging");
            dragState = null;
            goToIndex(nextIndex, true);
        }

        track.addEventListener("pointerdown", beginDrag);
        track.addEventListener("pointermove", updateDrag);
        track.addEventListener("pointerup", endDrag);
        track.addEventListener("pointercancel", endDrag);
        track.addEventListener("pointerleave", endDrag);

        if (prev) {
            prev.addEventListener("click", function () {
                goToIndex(window.GalleryUtils.getWrappedIndex(activeIndex, "previous", length), true);
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                goToIndex(window.GalleryUtils.getWrappedIndex(activeIndex, "next", length), true);
            });
        }

        window.addEventListener("resize", function () {
            setTrackPosition(activeIndex, 0, false);
        });

        updateNavButtons();
        goToIndex(0, false);
    }

    return {initGallery};
}));
