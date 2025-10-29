import { analytics, logEvent } from "./firebase.js";


logEvent(analytics, 'page_view');

// Keep the import line if present
// import { analytics, logEvent } from "./firebase.js";
// logEvent(analytics, 'page_view'); // Keep if present

function parse_args(url) {
    // This function seems okay, keep it.
    if (!url.includes("?")) return {}; // Handle URLs without params
    const args = url.split("?");
    if (!args[1]) return {};
    const kwarg_strs = args[1].split("&");
    let kwargs = {};
    for (let i = 0; i < kwarg_strs.length; i++) {
        let parts = kwarg_strs[i].split("=");
        if (parts.length === 2) {
             kwargs[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }
    }
    return kwargs;
}

// --- Helper: Function to translate NEW format post to OLD format ---
function translatePostToOldFormat(newPostData, pid) {
    if (!newPostData) return null;
    
    // Default values for fields expected by old frontend but missing in new
    const oldPost = {
        pid: newPostData.pid,
        text: newPostData.text || "",
        type: newPostData.type || "text", // Usually 'text' or 'image'
        timestamp: newPostData.timestamp || 0,
        reply: 0, // Will be updated later if comments are loaded
        likenum: newPostData.likenum || 0,
        extra: 0, // Placeholder
        anonymous: 1, // Placeholder (usually true for old hole)
        url: "", // Will be updated for images
        is_top: 0, // Placeholder
        label: 0, // Placeholder
        status: 0, // Placeholder
        is_comment: 1, // Placeholder (usually true)
        tag: newPostData.tag || null,
        is_follow: newPostData.attention ? 1 : 0, // Translate boolean to 1/0
        image_size: [0, 0], // Placeholder, maybe read from image_metadata if needed
        label_info: null, // Placeholder
        bookmark: null, // Placeholder
        // Add any other fields the original modify.js provided
        display_time: new Date(newPostData.timestamp * 1000).toLocaleString(), // Example formatting
        create_time: new Date(newPostData.timestamp * 1000).toLocaleString(), // Example formatting
        update_time: new Date((newPostData.updated_at || newPostData.timestamp) * 1000).toLocaleString(), // Example
    };

    // Handle image URL translation
    if (newPostData.local_image_path) {
        oldPost.url = "/" + newPostData.local_image_path.replace(/\\/g, '/');
        // Maybe try to get image size from image_metadata if available in newPostData?
        if(newPostData.image_metadata && newPostData.image_metadata.w && newPostData.image_metadata.h){
            oldPost.image_size = [newPostData.image_metadata.w, newPostData.image_metadata.h];
        }
    }

    // Update reply count from stored comments
    const comments_str = localStorage.getItem("comments_" + pid);
    oldPost.reply = comments_str ? JSON.parse(comments_str).length : (newPostData.reply || 0);


    return oldPost;
}

// --- Helper: Function to translate NEW format comment to OLD format ---
function translateCommentToOldFormat(newCommentData) {
    if (!newCommentData) return null;
    
    const oldComment = {
        cid: newCommentData.cid,
        pid: newCommentData.pid,
        text: newCommentData.text || "",
        timestamp: newCommentData.timestamp || 0,
        tag: newCommentData.tag || null, // Might need adjustment
        comment_id: null, // Old format didn't seem to use this extensively
        name: newCommentData.name || "Unknown",
        quote: null, // Old format didn't seem to use this extensively
        // Add other fields if the old frontend needs them
        display_time: new Date(newCommentData.timestamp * 1000).toLocaleString(),
        is_dz: newCommentData.is_dz || false, // Keep if available
        url: "" // Handle image translation
    };

     // Handle image URL translation
    if (newCommentData.local_image_path) {
        oldComment.url = "/" + newCommentData.local_image_path.replace(/\\/g, '/');
    }

    // Maybe handle reply_to? Old format used 'quote'. Needs more info on how old frontend displayed replies.
    // if (newCommentData.reply_to_cid && newCommentData.reply_to_cid !== -1) {
    //    // oldComment.quote = ??? // Need logic to find original text or format differently
    // }

    return oldComment;
}


// --- Modified Generator Functions ---

// REPLACE old gen_hole_pages
function gen_hole_pages(kwargs) {
    // logEvent(analytics, 'gen_hole_pages', { page: kwargs["page"] }); // Keep if using analytics

    let limit = Number(kwargs["limit"]) || 30; // Default limit consistent with old P大树洞
    let page = Number(kwargs["page"]) || 1;
    const hole_list_str = localStorage.getItem("hole_list");
    if (!hole_list_str) return { code: 40404, message: "No data imported yet." };

    // Get PIDs, sort numerically ascending, then reverse for newest first display.
    let hole_pid_list = JSON.parse(hole_list_str).sort((a, b) => a - b).reverse();

    let start_index = (page - 1) * limit;
    let end_index = page * limit;
    let hole_page_pids = hole_pid_list.slice(start_index, end_index);

    let translated_hole_page = [];
    for (let i = 0; i < hole_page_pids.length; i++) {
        let pid = hole_page_pids[i];
        let hole_str = localStorage.getItem("hole_" + pid);
        if (hole_str) {
            let newFormatHole = JSON.parse(hole_str);
            let oldFormatHole = translatePostToOldFormat(newFormatHole, pid); // Pass pid here
            if (oldFormatHole) {
                translated_hole_page.push(oldFormatHole);
            }
        }
    }

    let timestamp = new Date().getTime();
    const total_holes = hole_pid_list.length;
    const last_page = Math.ceil(total_holes / limit);

    // Return structure matching original modify.js
    return {
        "code": 20000, // Old API success code
        "data": {
            "current_page": page,
            "data": translated_hole_page, // The translated posts
            "first_page_url": "/api/pku_hole?page=1", // Using placeholder URLs
            "from": start_index + 1,
            "last_page": last_page,
            "last_page_url": `/api/pku_hole?page=${last_page}`,
            "next_page_url": page < last_page ? `/api/pku_hole?page=${page + 1}` : null,
            "path": "/api/pku_hole",
            "per_page": limit,
            "prev_page_url": page > 1 ? `/api/pku_hole?page=${page - 1}` : null,
            "to": start_index + translated_hole_page.length,
            "total": total_holes,
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };
}

// REPLACE old gen_hole_comment
function gen_hole_comment(kwargs, pid) {
    let limit = Number(kwargs["limit"]) || 30;
    let page = Number(kwargs["page"]) || 1;
    let sort_by = kwargs["sort"]; // 'asc' or 'desc'

    const comments_str = localStorage.getItem("comments_" + pid.toString());
    let all_new_format_comments = [];
    if (comments_str) {
        all_new_format_comments = JSON.parse(comments_str);
    }

    // Sort based on timestamp (using our new format data)
    all_new_format_comments.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        // Old P大树洞 default was often newest first ('desc')
        return sort_by === "asc" ? timeA - timeB : timeB - timeA;
    });

    let start_index = (page - 1) * limit;
    let end_index = page * limit;
    let comment_page_new_format = all_new_format_comments.slice(start_index, end_index);

    // Translate comments to old format
    let translated_comment_page = comment_page_new_format.map(translateCommentToOldFormat).filter(c => c !== null);

    let timestamp = new Date().getTime();
    const total_comments = all_new_format_comments.length;
    const last_page = Math.ceil(total_comments / limit);

    // Return structure matching original modify.js
    return {
        "code": 20000,
        "data": {
            "current_page": page,
            "data": translated_comment_page, // Translated comments
            "first_page_url": `/api/pku_comment_v3/${pid}?page=1`,
            "from": start_index + 1,
            "last_page": last_page,
            "last_page_url": `/api/pku_comment_v3/${pid}?page=${last_page}`,
            "next_page_url": page < last_page ? `/api/pku_comment_v3/${pid}?page=${page + 1}` : null,
            "path": `/api/pku_comment_v3/${pid}`,
            "per_page": limit,
            "prev_page_url": page > 1 ? `/api/pku_comment_v3/${pid}?page=${page - 1}` : null,
            "to": start_index + translated_comment_page.length,
            "total": total_comments,
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };
}

// REPLACE old gen_pku_hole
function gen_pku_hole(pid) {
    const hole_str = localStorage.getItem("hole_" + pid.toString());
    let timestamp = new Date().getTime();

    if (!hole_str) {
        // Return error structure matching original modify.js
        return {
            "code": 40001,
            "message": "您查看的树洞不存在",
            "success": false,
            "timestamp": timestamp
        };
    }
    
    let newFormatHole = JSON.parse(hole_str);
    let oldFormatHole = translatePostToOldFormat(newFormatHole, pid); // Translate

    if (!oldFormatHole) {
         return { code: 50000, message: "Failed to translate post data.", success: false, timestamp: timestamp };
    }

    // Return success structure matching original modify.js
    return {
        "code": 20000,
        "data": oldFormatHole, // The translated single post
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };
}

// No need to replace gen_pid_hole_page, gen_search_page, gen_followed_holes, set_attention
// UNLESS the frontend actually uses them AND you need those features.
// Let's focus on basic viewing first. We SHOULD replace set_attention because following is a core feature.

// REPLACE old set_attention
function set_attention(pid) {
    const hole_key = "hole_" + pid.toString();
    const hole_str = localStorage.getItem(hole_key);
    if (!hole_str) {
        return { code: 40404, message: "Hole not found", success: false, timestamp: new Date().getTime() };
    }
    
    let newFormatHole = JSON.parse(hole_str);
    let current_attention = newFormatHole.attention || false; // Use boolean from new format
    let res_str = "";

    if (current_attention) {
        newFormatHole.attention = false; // Set to false
        newFormatHole.likenum = (newFormatHole.likenum || 0) - 1; // Mimic old likenum change
        res_str = "取消关注";
    } else {
        newFormatHole.attention = true; // Set to true
        newFormatHole.likenum = (newFormatHole.likenum || 0) + 1; // Mimic old likenum change
        res_str = "关注成功";
    }
     // Ensure likenum doesn't go below 0
     if (newFormatHole.likenum < 0) newFormatHole.likenum = 0;

    // Save the modified NEW format data back
    localStorage.setItem(hole_key, JSON.stringify(newFormatHole));
    console.log("set_attention (new format)", pid, newFormatHole.attention);

    // Return success structure matching original modify.js
    return {
        "code": 20000,
        "data": res_str,
        "message": "success",
        "success": true,
        "timestamp": new Date().getTime()
    };
}


// --- Keep the original XHR Interception logic ---
// This part intercepts calls to the OLD API URLs and redirects them
// to our new gen_... functions which handle the translation.
(function () {
    'use strict';

    const OriginalXHR = window.XMLHttpRequest;

    function createFakeXHR() {
        // ... (Keep the entire original createFakeXHR function structure) ...
        let handlers = {};
        let xhr = {
            readyState: 4,
            status: 200,
            statusText: "OK",
            responseText: JSON.stringify({ message: "fake response" }),
            response: JSON.stringify({ message: "fake response" }),
            _intercepted: false, // Add flag to know if we should handle it

            open(method, url, async = true) {
                this._method = method;
                this._url = url;
                // --- Check if URL matches OLD API patterns ---
                if (
                    (url.includes("api/pku_hole") && url.includes("page")) || // List or Search
                    url.includes("pku_comment_v3") ||                       // Comments
                    url.includes("/api/pku/") ||                             // Single hole detail? (Check usage)
                    url.includes("api/follow_v2") ||                         // Followed list
                    url.includes("api/pku_attention")                        // Set attention/follow
                    // Add other OLD API URLs the frontend might call
                ) {
                    this._intercepted = true;
                    console.log("[FakeXHR] Intercepting:", method, url);
                } else {
                    this._intercepted = false;
                    console.log("[FakeXHR] Passing through:", method, url);
                }
                // We don't call real.open here, proxy handles it
            },

            send(body) {
                if (!this._intercepted) {
                    console.error("[FakeXHR] Send called on non-intercepted request? This shouldn't happen via proxy.");
                    return; // Or maybe call real.send? Needs careful thought. Usually proxy handles this.
                }

                console.log("[FakeXHR] processing intercepted: ", this._url);

                let responseData = {};

                try { // Add error handling around generation
                    // --- Call OUR generator functions based on OLD URL ---
                    if (
                        this._url.includes("api/pku_hole") && this._url.includes("page") && !this._url.includes("keyword") && !this._url.includes("pid=")
                    ) {
                        responseData = gen_hole_pages(parse_args(this._url));
                    } else if (this._url.includes("api/pku_hole") && this._url.includes("page") && this._url.includes("keyword")) {
                        // responseData = gen_search_page(parse_args(this._url)); // Keep original if needed
                        console.warn("[FakeXHR] Search endpoint not fully adapted yet."); responseData = {code: 50100, message: "Search not implemented"}; // Placeholder
                    } else if (this._url.includes("pku_comment_v3")) {
                        const kwargs = parse_args(this._url);
                        let pidMatch = this._url.match(/comment_v3\/(\d+)/); // Simpler PID extraction
                         if (pidMatch && pidMatch[1]) {
                             let pid = Number(pidMatch[1]);
                             responseData = gen_hole_comment(kwargs, pid);
                         } else {
                              throw new Error("Could not parse PID from comment URL: " + this._url);
                         }
                    } else if (this._url.includes("/api/pku/")) { // Matches single post like /api/pku/1234
                        let pidMatch = this._url.match(/\/api\/pku\/(\d+)/);
                         if (pidMatch && pidMatch[1]) {
                             let pid = Number(pidMatch[1]);
                             responseData = gen_pku_hole(pid);
                         } else {
                             throw new Error("Could not parse PID from single hole URL: " + this._url);
                         }
                    } else if (this._url.includes("/api/pku_hole") && this._url.includes("pid=")) { // May be another way frontend asks for single hole
                        let pidMatch = this._url.match(/pid=(\d+)/);
                         if (pidMatch && pidMatch[1]) {
                            let pid = Number(pidMatch[1]);
                            // Assuming this implies page=1, limit=1? Reusing gen_pku_hole might work if structure matches.
                            // Or reuse gen_pid_hole_page if structure is different. Let's try gen_pku_hole first.
                            responseData = gen_pku_hole(pid);
                            // responseData = gen_pid_hole_page(pid); // Use original if needed
                         } else {
                            throw new Error("Could not parse PID from single hole URL with pid=: " + this._url);
                         }
                    } else if (this._url.includes("api/follow_v2")) {
                        // responseData = gen_followed_holes(parse_args(this._url)); // Keep original if needed
                        console.warn("[FakeXHR] Followed list endpoint not fully adapted yet."); responseData = {code: 50100, message: "Followed list not implemented"}; // Placeholder
                    } else if (this._url.includes("api/pku_attention")) {
                         let pidMatch = this._url.match(/pku_attention\/(\d+)/);
                         if (pidMatch && pidMatch[1]) {
                            let pid = Number(pidMatch[1]);
                            responseData = set_attention(pid);
                         } else {
                             throw new Error("Could not parse PID from attention URL: " + this._url);
                         }
                    } else {
                        console.warn("[FakeXHR] Intercepted but unhandled URL:", this._url);
                        responseData = {code: 40400, message: "Unhandled local request", success: false, timestamp: new Date().getTime()};
                    }
                } catch (e) {
                     console.error("[FakeXHR] Error generating response for:", this._url, e);
                     responseData = {code: 50000, message: "Internal processing error: " + e.message, success: false, timestamp: new Date().getTime()};
                }


                this.responseText = JSON.stringify(responseData);
                this.response = this.responseText;
                this.status = responseData.code === 20000 ? 200 : 404; // Simulate status code roughly
                this.readyState = 4;

                // Simulate async triggering of events
                setTimeout(() => {
                    if (typeof this.onreadystatechange === "function") {
                        this.onreadystatechange();
                    }
                    if (typeof this.onload === "function") {
                        this.onload();
                    }
                }, 0);
            },

            // ... (Keep the rest of the original fake XHR methods: setRequestHeader, etc.) ...
            setRequestHeader() { },
            getAllResponseHeaders() { return "Content-Type: application/json"; }, // Fake header
            getResponseHeader() { return null; },
            abort() { },
            addEventListener(type, cb) {
                 handlers[type] = cb;
            },
            dispatchEvent(event) {
                 if (handlers[event.type]) {
                    handlers[event.type](event);
                 }
            }
        };
        return xhr;
    }

    // --- Keep the original Proxy logic ---
    // It decides whether to use our fake XHR or the real one based on the URL
    window.XMLHttpRequest = function () {
        const fake = createFakeXHR();
        const real = new OriginalXHR();

        // Need to bind methods of real XHR to itself
        const boundRealOpen = real.open.bind(real);
        const boundRealSend = real.send.bind(real);

        const proxy = new Proxy(fake, {
            get(target, prop) {
                // Special handling for open and send
                if (prop === 'open') {
                    // This method decides if we intercept or pass through
                    return function(method, url, async) {
                        target.open(method, url, async); // Let fake decide _intercepted flag
                        if (!target._intercepted) {
                            return boundRealOpen(method, url, async); // Use real open if not intercepting
                        }
                        // If intercepted, fake.open has already stored method/url
                    };
                }
                if (prop === 'send') {
                    return function(body) {
                        if (target._intercepted) {
                            return target.send(body); // Use fake send
                        } else {
                            return boundRealSend(body); // Use real send
                        }
                    };
                }

                // For all other properties, decide based on _intercepted flag
                const value = target._intercepted ? Reflect.get(target, prop) : Reflect.get(real, prop);
                // If the property is a function, bind it to the correct context
                 if (typeof value === 'function') {
                    return value.bind(target._intercepted ? target : real);
                 }
                return value;

            },
            set(target, prop, value) {
                // Set properties on the correct object
                if (target._intercepted || prop === '_intercepted' || prop === '_method' || prop === '_url') {
                    Reflect.set(target, prop, value);
                } else {
                    Reflect.set(real, prop, value);
                }
                return true;
            }
        });

        return proxy;
    };

    window.XMLHttpRequest.prototype = OriginalXHR.prototype; // Restore prototype chain

})();
