// given a cluster, find the squared distance of all pixels in the img from that cluster
function getSquaredDistanceOfImgToCluster(cl, img) {
    const r = img.length;
    const c = img[0].length;
    const out = Array.from({ length: r }, () => new Array(c));
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            const diff = [
                img[i][j][0] - cl[0],
                img[i][j][1] - cl[1],
                img[i][j][2] - cl[2]
            ];
            out[i][j] = diff[0] ** 2 + diff[1] ** 2 + diff[2] ** 2;
        }
    }
    return out;
}

// clusters the pixels into their respective clusters 
function clusterImg(cls, img) {
    const r = img.length;
    const c = img[0].length;
    const clusteredPixels = Array.from({ length: r }, () => new Array(c).fill(null));
    const dsts = Array.from({ length: r }, () => new Array(c).fill(Infinity));

    for (let clIdx = 0; clIdx < cls.length; clIdx++) {
        // get distances of all pixels from one cluster
        const dst = getSquaredDistanceOfImgToCluster(cls[clIdx], img);
        for (let i = 0; i < r; i++) {
            for (let j = 0; j < c; j++) {
                // add the point to the current cluster if it has a better distance than before
                if (dst[i][j] < dsts[i][j]) {
                    clusteredPixels[i][j] = clIdx;
                    dsts[i][j] = dst[i][j];
                }
            }
        }
    }
    return clusteredPixels;
}

// for every cluster, calculate its average color value
function getNewCenters(asgn, img, k) {
    const r = img.length;
    const c = img[0].length;
    const centers = Array.from({ length: k }, () => [0, 0, 0]);
    const count = new Array(k).fill(0);

    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            const cl = asgn[i][j];
            centers[cl][0] += img[i][j][0];
            centers[cl][1] += img[i][j][1];
            centers[cl][2] += img[i][j][2];
            count[cl]++;
        }
    }

    for (let i = 0; i < k; i++) {
        if (count[i] === 0) {
            centers[i] = [-255, -255, -255];
        } else {
            centers[i] = centers[i].map(v => Math.min(255, Math.max(0, v / count[i])));
        }
    }
    return centers;
}

// run k-means with an initial set of clusters and runs n iterations
function kMeansStandard(cls, img, n) {
    let asgn;
    for (let i = 0; i < n; i++) {
        asgn = clusterImg(cls, img);
        cls = getNewCenters(asgn, img, cls.length);
    }
    return [cls, asgn];
}

// creates a set of clusters using the image information and then calls k-means++
function kMeansPlusPlus(img, k, n) {
    const r = img.length;
    const c = img[0].length;

    // pick a random pixel
    const randomColor = () => [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    ];

    let cls = [randomColor()];

    for (let iter = 1; iter < k; iter++) {
        let minDsts = Array.from({ length: r }, () => new Array(c).fill(Infinity));
        for (const cl of cls) {
            const dst = getSquaredDistanceOfImgToCluster(cl, img);
            for (let i = 0; i < r; i++) {
                for (let j = 0; j < c; j++) {
                    minDsts[i][j] = Math.min(minDsts[i][j], dst[i][j]);
                }
            }
        }

        // turn distances into a probability distribution and sample from that for new cluster
        const flatMinDsts = minDsts.flat();
        const total = flatMinDsts.reduce((a, b) => a + b, 0);
        const probs = flatMinDsts.map(x => (total > 0 ? x / total : 0));
        const cumulative = probs.reduce((acc, val, i) => {
            acc.push((acc[i - 1] || 0) + val);
            return acc;
        }, []);

        const rand = Math.random();
        const idx = cumulative.findIndex(p => p > rand);
        const row = Math.floor(idx / c);
        const col = idx % c;
        cls.push([...img[row][col]]);
    }

    // call k-means and create RGB array for return image 
    const [finalCls, asgn] = kMeansStandard(cls, img, n);
    const outImg = Array.from({ length: r }, () => new Array(c));
    for (let i = 0; i < r; i++) {
        for (let j = 0; j < c; j++) {
            outImg[i][j] = finalCls[asgn[i][j]];
        }
    }

    return [outImg, finalCls];
}