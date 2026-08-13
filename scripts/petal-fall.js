// 화면 전체에 꽃잎이 떨어지는 배경 이펙트 — 이미지 없이 canvas로 직접 그린다
(function (root, factory) {
    const utils = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = utils;
    }

    if (root) {
        root.PetalFall = utils;
    }
}(typeof window !== "undefined" ? window : globalThis, function () {
    const PETAL_COLORS = ["#E08BA0", "#C86E87", "#F3C6D2"];
    const MIN_PETALS = 12;
    const MAX_PETALS = 30;

    function resolvePetalCount(canvasWidth) {
        return Math.max(MIN_PETALS, Math.min(MAX_PETALS, Math.floor(canvasWidth / 60)));
    }

    function createPetal(canvasWidth, canvasHeight, randomFn) {
        const rand = randomFn || Math.random;

        return {
            baseX: rand() * canvasWidth,
            y: rand() * canvasHeight,
            rotation: rand() * 360,
            fallSpeed: 0.6 + rand() * 0.8,
            swayAmplitude: 10 + rand() * 20,
            swayFrequency: 0.01 + rand() * 0.01,
            rotationSpeed: (rand() - 0.5) * 2,
            size: 6 + rand() * 8,
            opacity: 0.55 + rand() * 0.3,
            color: PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)]
        };
    }

    function stepPetal(petal, canvasWidth, canvasHeight, randomFn) {
        const rand = randomFn || Math.random;
        let baseX = petal.baseX;
        let y = petal.y + petal.fallSpeed;
        const rotation = petal.rotation + petal.rotationSpeed;

        if (y > canvasHeight + petal.size) {
            y = -petal.size;
            baseX = rand() * canvasWidth;
        }

        const x = baseX + Math.sin(y * petal.swayFrequency) * petal.swayAmplitude;

        return {
            baseX: baseX,
            x: x,
            y: y,
            rotation: rotation,
            fallSpeed: petal.fallSpeed,
            swayAmplitude: petal.swayAmplitude,
            swayFrequency: petal.swayFrequency,
            rotationSpeed: petal.rotationSpeed,
            size: petal.size,
            opacity: petal.opacity,
            color: petal.color
        };
    }

    function drawPetal(ctx, petal) {
        ctx.save();
        ctx.translate(petal.x, petal.y);
        ctx.rotate((petal.rotation * Math.PI) / 180);
        ctx.globalAlpha = petal.opacity;
        ctx.fillStyle = petal.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, petal.size, petal.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function init(doc) {
        const targetDocument = doc || (typeof document !== "undefined" ? document : null);

        if (!targetDocument) {
            return;
        }

        if (typeof window !== "undefined" && window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const canvas = targetDocument.getElementById("petal-fall-canvas");

        if (!canvas || !canvas.getContext) {
            return;
        }

        const ctx = canvas.getContext("2d");
        let petals = [];

        function resize() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            const count = resolvePetalCount(canvas.width);
            petals = [];

            for (let i = 0; i < count; i += 1) {
                petals.push(createPetal(canvas.width, canvas.height));
            }
        }

        function frame() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            petals = petals.map(function (petal) {
                const next = stepPetal(petal, canvas.width, canvas.height);
                drawPetal(ctx, next);
                return next;
            });
            window.requestAnimationFrame(frame);
        }

        window.addEventListener("resize", resize);
        resize();
        window.requestAnimationFrame(frame);
    }

    return {
        resolvePetalCount,
        createPetal,
        stepPetal,
        drawPetal,
        init
    };
}));
