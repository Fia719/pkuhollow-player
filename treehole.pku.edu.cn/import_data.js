

function init_buttons(selectElement, cleanElement, buttonElement) {
	cleanElement.textContent = "清空";
	cleanElement.style.minWidth = "60px";
	if (selectElement) {
		selectElement.insertAdjacentElement("afterend", cleanElement);
		selectElement.style.width = "50%";
	} else {
		console.error("selectElement not found");
	}
	buttonElement.textContent = "导入";
	buttonElement.style.minWidth = "60px";
	if (selectElement) {
		selectElement.insertAdjacentElement("afterend", buttonElement);
		selectElement.style.width = "50%";
	} else {
		console.error("selectElement not found");
	}
}


async function readFileAsync(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		// 成功读取文件
		reader.onload = function (event) {
			resolve(event.target.result);
		};

		// 读取文件失败
		reader.onerror = function (error) {
			reject(error);
		};

		// 读取文件内容为文本
		reader.readAsText(file);
	});
}

async function parseFile(file) {
	try {
		const content = await readFileAsync(file);
		if (file.name.endsWith(".json")) {
			return JSON.parse(content);
		} else {
			return {};
		}
	} catch (error) {
		console.error("Failed to read file:", error);
		throw error;
	}
}


// REPLACE the old update_data function with this one
async function update_data(file_data) {
    // Our backup JSON is directly a list of posts
    const all_posts = file_data; // Assume file_data is the array from our JSON

    if (!Array.isArray(all_posts)) {
        console.error("Imported data is not an array of posts!");
        alert("导入失败：JSON文件格式似乎不是预期的帖子列表。");
        return;
    }

    console.log(`Processing ${all_posts.length} posts from imported file...`);

    var current_hole_pid_list = [];

    for (const post of all_posts) {
        if (!post || typeof post.pid === 'undefined') {
            console.warn("Skipping invalid post object:", post);
            continue;
        }

        const pid = post.pid;
        const hole_key = "hole_" + pid.toString();
        const comments_key = "comments_" + pid.toString();

        // Separate comments from the main post data for storage
        const comments_data = post.comments_data || [];
        // Create a copy of the post object without comments_data for hole storage
        const hole_data_to_store = { ...post };
        delete hole_data_to_store.comments_data;

        // Store the main hole data
        localStorage.setItem(hole_key, JSON.stringify(hole_data_to_store));

        // Store the comments data (as an array, which modify.js will handle)
        localStorage.setItem(comments_key, JSON.stringify(comments_data));

        current_hole_pid_list.push(pid);
    }

    // Merge old pid_list and new pid_list from this file
    const hole_list_key = "hole_list";
    const old_pid_list_str = localStorage.getItem(hole_list_key);
    let combined_pid_list = current_hole_pid_list;

    if (old_pid_list_str) {
        try {
            const old_pid_list = JSON.parse(old_pid_list_str);
            combined_pid_list = combined_pid_list.concat(old_pid_list);
        } catch (e) {
            console.error("Error parsing existing hole list, overwriting.", e);
        }
    }

    // Deduplicate and sort (numerically)
    combined_pid_list = Array.from(new Set(combined_pid_list)).sort((a, b) => a - b);

    localStorage.setItem(hole_list_key, JSON.stringify(combined_pid_list));
    console.log(`Updated hole list stored. Total unique PIDs: ${combined_pid_list.length}`);
}

// ALSO, find the line: var file_data = await parseFile(file);
// And REPLACE the line BELOW it: console.log("file_data", file_data);
// With this line to handle potential errors during update:
try {
    await update_data(file_data); // Use await here if update_data becomes async
} catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    alert(`处理文件 ${file.name} 时出错: ${error.message}`);
}

function init_import_data() {
	"use strict";
	const selectElement = document.querySelector(".select-header.control-search");
	const cleanElement = document.createElement("button");
	const inputbuttonElement = document.createElement("button");

	init_buttons(selectElement, cleanElement, inputbuttonElement);
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.id = "file-input";
	fileInput.style.display = "none";
	// multiple files
	fileInput.multiple = true;
	document.body.appendChild(fileInput);

	// file list var
	var flist = [];

	cleanElement.addEventListener("click", function () {
		const flist_str = flist.map(f => f.name).join("\n");
		const confirm_clean = confirm("清空导入文件列表以及本地缓存？\n" + flist_str);
		if (confirm_clean) {
			flist = [];
			cleanElement.textContent = "清空";
			// todo store flist in localstorage
			// clean all storage
			localStorage.clear();
		}
	});

	inputbuttonElement.addEventListener("click", function () {
		const confirm_input = confirm("是否导入文件列表？\n（可一次导入多个，可导入多次）");
		if (confirm_input) {
			fileInput.click();
		}
	});

	fileInput.addEventListener("change", async function (event) {
		// copy
		const newfiles = event.target.files;
		if (newfiles.length == 0) {
			return;
		}
		// extend flist
		flist = flist.concat(Array.from(newfiles));
		cleanElement.textContent = "清空: " + flist.length;
		// show file names
		console.log(flist);
		for (const file of newfiles) {
			console.log(file.name);
			var file_data = await parseFile(file);
			console.log("file_data", file_data);
			update_data(file_data);
		}
		alert("已导入成功! 请点击左侧最新按钮查看");
	});




}

function init_welcome_hole() {
	const data = {
		"holes": [
			{
				"pid": 1,
				"text": "欢迎来到树洞存档阅读网站，你可以在这里导入你通过树洞导出插件(https://greasyfork.org/zh-CN/scripts/465805-pku-hole-export-tool)得到的json文件，支持多个文件导入，目前暂不支持txt格式文件导入。\n请注意，这是一个纯静态网站，不会将用户导入的数据上传至网络，用户导入的文件只会存储在本地，请大家放心自己的隐私不会泄露。\n本网站通过拦截用户发送请求的404回复，使用浏览器缓存替换返回结果以变相实现对api请求的回复，因此会有一些无意义的网络流量产生。\nGithub地址：https://github.com/w1ndman/treehole-player",
				"type": "text",
				"timestamp": 1627948170,
				"reply": 1,
				"likenum": 120,
				"extra": 0,
				"anonymous": 1,
				"url": "",
				"is_top": 0,
				"label": 0,
				"status": 0,
				"is_comment": 1,
				"tag": null,
				"is_follow": 0,
				"image_size": [
					0,
					0
				],
				"label_info": null,
				"bookmark": null
			}
		],

		"comments": [

			[
				[
					{
						"cid": 2,
						"pid": 1,
						"text": "大家若有希望展示在这里的留言，可以在Github上提issue留言，有一定概率会被合并入此洞，具体格式请看README～",
						"timestamp": 1627948170,
						"tag": "Github",
						"comment_id": null,
						"name": "please issue on Github!!",
						"quote": null
					}
				]
			]
		]
	};
	update_data(data);
}


window.addEventListener("load", init_import_data);

init_welcome_hole();





