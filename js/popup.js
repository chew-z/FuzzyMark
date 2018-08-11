/* global Fuse */
const fuseOptions = {
    keys: [{ name: "title", weight: 0.7 }, { name: "path", weight: 0.2 }, { name: "url", weight: 0.1 }], // 'title', 'url', 'path'],
    threshold: 0.5,
    location: 0,
    distance: 160,
    includeScore: true,
    maxPatternLength: 24,
    minMatchCharLength: 3,
    shouldSort: true,
    tokenize: false,
};
let bookmarksList = [];
let fuse;

function displayResults(results, location) {
    /**
     * @param {Array.<BookmarkTreeNode>} results - The BookmarkTreeNodes to render in the UI
     * @param {string} location - The CSS selector of the UI container in which to render
     * @requires module:jquery
     */
    $(location).empty();
    const dateOptions = { year: "numeric", month: "short", day: "numeric" };
    const dateTimeFormat = new Intl.DateTimeFormat("pl-PL", dateOptions);
    const resultNodes = results.map((res) => {
        // console.log(res);
        const score = (100.0 * res.score).toFixed(3);
        const title = res.item.title;
        const path = res.item.path;
        const url = res.item.url;
        const date = new Date(res.item.dateAdded);
        const bookmarkDate = dateTimeFormat.format(date);
        const resElem = `
            <div class="row search-item" data-toggle="tooltip" data-placement="top" title="${url}">
                <a href="${url}" target="_blank" class="url">
                    <div class="score">${score}:&ensp;</div>
                    <div class="date">${bookmarkDate}</div>
                    <div class="path">${path}:&ensp;</div>
                    <div class="title">${title}</div>
                </a>
            </div>
        `;

        return $(resElem);
    });
    $(location).append(resultNodes);
}

function flattenArray(arr) {
    /**
     * Return a flattened array without any children
     * @param {Array.<BookmarkTreeNode>} arr - BookmarkTreeNodes with children
     * @param {Array.<BookmarkTreeNode>} arr.children - BookmarkTreeNodes with children
     * @returns {Array.<BookmarkTreeNode>}
     */
    let tempPtr = arr;
    while (tempPtr.some((node) => node.hasOwnProperty("children"))) {
        tempPtr = tempPtr.reduce((acc, curr) => {
            if (curr.hasOwnProperty("children")) {
                return acc.concat(curr.children);
            } else {
                return acc.concat([curr]);
            }
        }, []);
    }

    return tempPtr;
}

function initNodePaths(parent, parentPath) {
    /**
     * Recursively create a path attribute for every child node in the tree whose root is @parent
     * @param {BookmarkTreeNode} parent - The node whose path will be given to its children
     * @param {string} parentPath - The path to give to
     */
    parent.children.forEach((child) => {
        child.path = parentPath;
        if (child.hasOwnProperty("children")) {
            child.path += `${child.title}`;
            initNodePaths(child, child.path);
        }
    });
}

// initialise Fuse instance
chrome.bookmarks.getTree((results) => {
    const bookmarks = results[0].children.find((child) => child.title === "Other bookmarks");
    initNodePaths(bookmarks, "");
    bookmarksList = flattenArray(bookmarks.children);
    fuse = new Fuse(bookmarksList, fuseOptions);
});

$("#search-input").on("input", function(event) {
    const query = $(this).val();
    const results = fuse.search(query);

    if (results.length > 0) {
        $("body").addClass("res-present");
    } else {
        $("body").removeClass("res-present");
    }
    displayResults(results, ".results-box");
});
