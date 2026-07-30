// 제공해주신 Google Apps Script 웹 앱 URL
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyCQ2eJQJn52opiAlwTIjKhDSND2gE0wCTE3f4Vhi4JneKqAQi8Z1CJo3YAoiLvxaY/exec";

document.addEventListener("DOMContentLoaded", () => {
  loadGallery();

  const form = document.getElementById("event-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.innerText = "업로드 중...";
    submitBtn.disabled = true;

    const fileInput = document.getElementById("image-file");
    const file = fileInput.files[0];

    // 이미지를 Base64 변환
    const base64Image = await convertBase64(file);

    const payload = {
      action: "submit",
      company: document.getElementById("company").value,
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      branch: document.getElementById("branch").value,
      nickname: document.getElementById("nickname").value,
      title: document.getElementById("title").value,
      image: {
        name: file.name,
        mimeType: file.type,
        data: base64Image.split(',')[1]
      }
    };

    try {
      await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      alert("작품이 성공적으로 등록되었습니다!");
      form.reset();
      loadGallery();
    } catch (err) {
      alert("등록 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      submitBtn.innerText = "작품 등록하기";
      submitBtn.disabled = false;
    }
  });
});

// 갤러리 불러오기
async function loadGallery() {
  const gallery = document.getElementById("gallery-grid");
  gallery.innerHTML = "<p>작품을 불러오는 중입니다...</p>";

  try {
    const response = await fetch(`${GAS_WEB_APP_URL}?action=getPosts`);
    const posts = await response.json();

    gallery.innerHTML = "";
    if (posts.length === 0) {
      gallery.innerHTML = "<p>아직 등록된 작품이 없습니다. 1호 작품의 주인공이 되어보세요!</p>";
      return;
    }

    posts.forEach(post => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${post.imageUrl}" alt="${post.title}">
        <div class="card-body">
          <div>
            <div class="card-title">${escapeHtml(post.title)}</div>
            <div class="card-author">작성자: ${escapeHtml(post.nickname)}</div>
          </div>
          <button class="vote-btn" onclick="vote('${post.id}', this)">
            ❤️ 투표하기 <span class="vote-count">${post.votes}</span>
          </button>
        </div>
      `;
      gallery.appendChild(card);
    });
  } catch (err) {
    gallery.innerHTML = "<p>작품 목록을 불러오지 못했습니다.</p>";
  }
}

// 투표하기
async function vote(postId, btnElement) {
  btnElement.disabled = true;
  try {
    const res = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "vote", id: postId })
    });
    const result = await res.json();
    if (result.result === "success") {
      const countSpan = btnElement.querySelector(".vote-count");
      countSpan.innerText = result.votes;
      alert("투표가 완료되었습니다!");
    }
  } catch (err) {
    alert("투표 처리 중 오류가 발생했습니다.");
  } finally {
    btnElement.disabled = false;
  }
}

// Base64 변환 헬퍼
function convertBase64(file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}