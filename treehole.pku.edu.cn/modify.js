

function parse_args(url) {
    const args = url.split("?");
    const kwarg_strs = args[1].split("&");
    let kwargs = {};
    for (let i = 0; i < kwarg_strs.length; i++) {
        let key = kwarg_strs[i].split("=")[0];
        let value = kwarg_strs[i].split("=")[1];
        kwargs[key] = value;
    }
    return kwargs;
}

function gen_hole_pages(kwargs) {
    let limit = Number(kwargs["limit"]);
    let page = Number(kwargs["page"]);
    const hole_list = localStorage.getItem("hole_list");
    // reverse order
    let hole_pid_list = JSON.parse(hole_list).reverse();
    let start = (page - 1) * limit;
    let end = page * limit;
    let hole_page_pids = hole_pid_list.slice(start, end);

    let hole_page = [];
    for (let i = 0; i < hole_page_pids.length; i++) {
        let pid = hole_page_pids[i];
        let hole = JSON.parse(localStorage.getItem("hole_" + pid));
        hole_page.push(hole);
    }

    let timestamp = new Date().getTime();
    return {
        "code": 20000,
        "data": {
            "current_page": page,
            "data": hole_page,
            "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
            "from": start,
            "last_page": Math.ceil(hole_pid_list.length / limit),
            "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=" + Math.ceil(hole_pid_list.length / limit),
            "next_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=" + (page + 1),
            "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole",
            "per_page": limit,
            "prev_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=" + (page - 1),
            "to": end,
            "total": hole_pid_list.length,
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };
}

function gen_hole_comment(kwargs, pid) {
    let limit = Number(kwargs["limit"]);
    // page: default 1
    let page = 1;
    if (kwargs["page"]) {
        page = Number(kwargs["page"]);
    }
    let sort_by = kwargs["sort"];

    let comments = localStorage.getItem("comments_" + pid.toString());
    let comment_cids = [];
    let start = (page - 1) * limit;
    let end = page * limit;
    let comment_page = [];
    if (comments) {
        let comments_map = JSON.parse(comments);
        comment_cids = Object.keys(comments_map);
        if (sort_by == "desc") {
            comment_cids = comment_cids.reverse();
        }
        let comment_page_cids = comment_cids.slice(start, end);

        for (let i = 0; i < comment_page_cids.length; i++) {
            let cid = comment_page_cids[i];
            let comment = comments_map[cid];
            comment_page.push(comment);
        }

    }

    let timestamp = new Date().getTime();
    return {
        "code": 20000,
        "data": {
            "current_page": page,
            "data": comment_page,
            "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/" + pid + "?page=1",
            "from": start,
            "last_page": Math.ceil(comment_cids.length / limit),
            "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/" + pid + "?page=" + Math.ceil(comment_cids.length / limit),
            "next_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/" + pid + "?page=" + (page + 1),
            "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/" + pid,
            "per_page": limit,
            "prev_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_comment_v3\/" + pid + "?page=" + (page - 1),
            "to": end,
            "total": comment_cids.length,
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    }

}

function gen_pku_hole(pid) {
    // /pku/hole
    let hole = JSON.parse(localStorage.getItem("hole_" + pid));
    let timestamp = new Date().getTime();
    if (!hole) {
        return {
            "code": 40001,
            "message": "您查看的树洞不存在",
            "success": false,
            "timestamp": timestamp
        }
    }
    return {
        "code": 20000,
        "data": hole,
        "message": "success",
        "success": true,
        "timestamp": timestamp
    }
}

function gen_pid_hole_page(pid) {
    let hole = JSON.parse(localStorage.getItem("hole_" + pid));
    let timestamp = new Date().getTime();
    return {
        "code": 20000,
        "data": {
            "current_page": 1,
            "data": [hole],
            "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
            "from": 1,
            "last_page": 1,
            "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole?page=1",
            "next_page_url": null,
            "path": "http:\/\/treehole.pku.edu.cn\/api\/pku_hole",
            "per_page": 15,
            "prev_page_url": null,
            "to": 1,
            "total": 1
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp

    }
}

function gen_search_page(kwargs) {
    let limit = Number(kwargs["limit"]);
    let page = Number(kwargs["page"]);
    let keyword = decodeURIComponent(kwargs["keyword"]);
    const hole_list = localStorage.getItem("hole_list");
    let hole_pid_list = JSON.parse(hole_list).reverse();
    let start, end;
    let count_begin = limit * (page - 1);
    let count_end = limit * page;
    let count = 0;
    let hole_page = [];
    for (let i = 0; i < hole_pid_list.length; i++) {
        let pid = hole_pid_list[i];
        let hole = JSON.parse(localStorage.getItem("hole_" + pid));

        if (hole["text"] && hole["text"].includes(keyword)) {
            if (count == count_begin) {
                start = i;
                hole_page.push(hole);
            }
            if (count == count_end || i == hole_pid_list.length - 1) {
                end = i;
                break;
            }
            if (i > count_begin && i < count_end) {
                hole_page.push(hole);
            }
            count += 1;

        }

    }
    let timestamp = new Date().getTime();
    return {
        "code": 20000,
        "data": {
            "current_page": page,
            "data": hole_page,
            "first_page_url": "http://treehole.pku.edu.cn/api/pku_hole?page=1",
            "from": start,
            "last_page": Math.ceil(count / limit),
            "last_page_url": "http://treehole.pku.edu.cn/api/pku_hole?page=" + Math.ceil(count / limit),
            "next_page_url": "http://treehole.pku.edu.cn/api/pku_hole?page=" + (page + 1),
            "path": "http://treehole.pku.edu.cn/api/pku_hole",
            "per_page": limit,
            "prev_page_url": "http://treehole.pku.edu.cn/api/pku_hole?page=" + (page - 1),
            "to": end,
            "total": count,
        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };
}


function gen_followed_holes(kwargs) {
    // todo: need to store followed holes, and better search
    let limit = Number(kwargs["limit"]);
    let page = Number(kwargs["page"]);
    const hole_list = localStorage.getItem("hole_list");
    let hole_pid_list = JSON.parse(hole_list).reverse();
    let start, end;
    // need to search for end, maybe some if hole is not followed
    let count_begin = limit * (page - 1);
    let count_end = limit * page;
    let count = 0;
    let hole_page = [];
    for (let i = 0; i < hole_pid_list.length; i++) {
        let pid = hole_pid_list[i];
        let hole = JSON.parse(localStorage.getItem("hole_" + pid));
        if (hole["is_follow"] == 1) {
            if (count == count_begin) {
                start = i;
                hole_page.push(hole);
            }
            if (count == count_end) {
                end = i;
                break;
            }
            if (i > count_begin && i < count_end) {
                hole_page.push(hole);
            }
            count += 1;

        }
        if (i == hole_pid_list.length - 1) {
            end = i;
        }
    }
    let timestamp = new Date().getTime();
    console.log("gen_followed_holes", start, end, count, hole_page);
    return {
        "code": 20000,
        "data": {
            "current_page": page,
            "data": hole_page,
            "first_page_url": "http:\/\/treehole.pku.edu.cn\/api\/follow_v2?page=1",
            "from": start,
            "last_page": Math.ceil(hole_pid_list.length / limit),
            "last_page_url": "http:\/\/treehole.pku.edu.cn\/api\/follow_v2?page=" + Math.ceil(hole_pid_list.length / limit),
            "next_page_url": "http:\/\/treehole.pku.edu.cn\/api\/follow_v2?page=" + (page + 1),
            "path": "http:\/\/treehole.pku.edu.cn\/api\/follow_v2",
            "per_page": limit,
            "prev_page_url": "http:\/\/treehole.pku.edu.cn\/api\/follow_v2?page=" + (page - 1),
            "to": end,
            "total": count,

        },
        "message": "success",
        "success": true,
        "timestamp": timestamp
    };



}


function set_attention(pid) {
    // load hole
    let hole = JSON.parse(localStorage.getItem("hole_" + pid));
    let is_follow = hole["is_follow"];
    let res_str = "";
    if (is_follow == 1) {
        hole["is_follow"] = 0;
        hole["likenum"] -= 1;
        res_str = "取消关注";
    } else {
        hole["is_follow"] = 1;
        hole["likenum"] += 1;
        res_str = "关注成功";
    }
    localStorage.setItem("hole_" + pid, JSON.stringify(hole));
    console.log("set_attention", pid, hole["is_follow"]);

    return {
        "code": 20000,
        "data": res_str,
        "message": "success",
        "success": true,
        "timestamp": new Date().getTime()
    }
}

(function () {
    'use strict';

    const OriginalXHR = window.XMLHttpRequest;

    function createFakeXHR() {
        let handlers = {};
        let xhr = {
            readyState: 4,
            status: 200,
            statusText: "OK",
            responseText: JSON.stringify({ message: "fake response" }),
            response: JSON.stringify({ message: "fake response" }),

            open(method, url, async = true) {
                this._method = method;
                this._url = url;
            },

            send(body) {
                console.log("[FakeXHR] 拦截并模拟响应", this._url);

                // 根据不同 URL 返回不同内容
                let responseData = {};

                if (
                    this._url.includes("api/pku_hole") && this._url.includes("page") && !this._url.includes("keyword")
                ) {
                    responseData = gen_hole_pages(parse_args(this._url));
                } else if (this._url.includes("api/pku_hole") && this._url.includes("page") && this._url.includes("keyword")) {
                    responseData = gen_search_page(parse_args(this._url));
                } else if (this._url.includes("pku_comment_v3")) {
                    const kwargs = parse_args(this._url);
                    let pid = Number(this._url.match(/comment_v3\/(\d+)\?/)[1]);
                    responseData = gen_hole_comment(kwargs, pid);
                } else if (this._url.includes("/api/pku/")) {
                    let pid = Number(this._url.split("/api/pku/")[1]);
                    responseData = gen_pku_hole(pid);
                } else if (this._url.includes("/api/pku_hole")) {
                    let pid = Number(this._url.split("pid=")[1]);   
                    responseData = gen_pid_hole_page(pid);
                } else if (this._url.includes("api/follow_v2")) {
                    responseData = gen_followed_holes(parse_args(this._url));
                } else if (this._url.includes("api/pku_attention")) {
                    let pid = Number(this._url.split("pku_attention/")[1]);
                    responseData = set_attention(pid);
                } else {
                    console.warn("[FakeXHR] 未处理的请求 URL:", this._url);
                }

                this.responseText = JSON.stringify(responseData);
                this.response = this.responseText;

                // 模拟异步触发事件
                setTimeout(() => {
                    if (typeof this.onreadystatechange === "function") {
                        this.onreadystatechange();
                    }
                    if (typeof this.onload === "function") {
                        this.onload();
                    }
                }, 0);
            },

            setRequestHeader() { },
            getAllResponseHeaders() { return ""; },
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

    // 代理构造函数
    window.XMLHttpRequest = function () {
        const fake = createFakeXHR();
        const real = new OriginalXHR();

        // 判断 URL 是否要拦截，在 open 中实现
        const proxy = new Proxy(fake, {
            get(target, prop) {
                if (prop === 'open') {
                    return function (method, url, async) {
                        // 控制是否要拦截
                        if (
                            (url.includes("api/pku_hole") && url.includes("page")) ||
                            url.includes("pku_comment_v3") ||
                            url.includes("/api/pku/") ||
                            url.includes("/api/pku_hole") ||
                            url.includes("api/follow_v2") ||
                            url.includes("api/pku_attention")
                        ) {
                            target._intercepted = true;
                            return target.open(method, url, async);
                        } else {
                            target._intercepted = false;
                            return real.open(method, url, async);
                        }
                    };
                }
                if (prop === 'send') {
                    return function (body) {
                        if (target._intercepted) {
                            return target.send(body);
                        } else {
                            return real.send(body);
                        }
                    };
                }
                if (target._intercepted) {
                    return target[prop];
                } else {
                    return real[prop];
                }
            },
            set(target, prop, value) {
                if (target._intercepted) {
                    target[prop] = value;
                } else {
                    real[prop] = value;
                }
                return true;
            }
        });

        return proxy;
    };

    window.XMLHttpRequest.prototype = OriginalXHR.prototype;


})();