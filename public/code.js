  const socket = io();
    let receiverID;

    // Theme toggle
    const toggleBtn = document.getElementById("theme-toggle");
    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      toggleBtn.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙";
    });

    function generateID(){
      return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
    }

    document.getElementById("sender-start-con-btn").addEventListener("click", ()=>{
      const joinID = generateID();
      document.getElementById("join-id").innerHTML = `<b>Room ID:</b> <spantitle="Click to copy" onclick="copyToClipboard('${joinID}receiver.html')" >${joinID}</span>`;
      document.getElementById("path-id").innerHTML = `<b>Share to get file:</b> <span title="Click to copy" onclick="copyToClipboard('${window.location.href}receiver.html')">${window.location.href}receiver.html</span>`;
      socket.emit("sender-join",{ uid:joinID });
    });

    async function copyToClipboard(textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        alert('Text copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please try again or copy manually.');
      }
    }

    socket.on("init", uid=>{
      receiverID = uid;
      document.querySelector(".join-screen").style.display="none";
      document.querySelector(".fs-screen").style.display="block";
    });

    document.getElementById("file-input").addEventListener("change", e=>{
      let file = e.target.files[0];
      if(!file) return;

      let reader = new FileReader();
      reader.onload = ()=>{
        let buffer = new Uint8Array(reader.result);
        let fileBox = document.createElement("div");
        fileBox.className="item";
        fileBox.innerHTML = `<div><b>${file.name}</b></div>
        <div class="progress-bar"><div class="progress"></div></div>`;
        document.querySelector(".files-list").appendChild(fileBox);

        shareFile({
          filename:file.name,
          total_buffer_size:buffer.length,
          buffer_size:1024
        }, buffer, fileBox.querySelector(".progress"));
      }
      reader.readAsArrayBuffer(file);
    });

    function shareFile(metadata,buffer,progressEl){
      socket.emit("file-meta",{ uid:receiverID, metadata });
      socket.on("fs-share",()=>{
        let chunk = buffer.slice(0,metadata.buffer_size);
        buffer = buffer.slice(metadata.buffer_size,buffer.length);
        let sent = metadata.total_buffer_size-buffer.length;
        let percent = Math.floor((sent/metadata.total_buffer_size)*100);
        progressEl.style.width=percent+"%";

        if(chunk.length!=0){
          socket.emit("file-raw",{ uid:receiverID, buffer:chunk });
        }else{
          console.log("✅ File Sent!");
        }
      });
    }
