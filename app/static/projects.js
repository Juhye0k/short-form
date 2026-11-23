"use strict";
(() => {
  const list = document.getElementById("project-list");
  const status = document.getElementById("project-state");
  const more = document.getElementById("project-more");
  const states = {pending:"접수 중", queued:"분석 대기", running:"분석 중", succeeded:"분석 완료", failed:"분석 실패"};
  const date = new Intl.DateTimeFormat("ko-KR", {dateStyle:"medium", timeStyle:"short"});
  const pageSize = 12;
  let offset = 0, generation = 0;

  async function load(reset = false) {
    if (reset) { offset = 0; list.replaceChildren(); more.hidden = true; }
    const version = ++generation;
    more.disabled = true;
    status.textContent = "프로젝트를 불러오는 중입니다.";
    try {
      const response = await fetch("/analyses?limit=" + pageSize + "&offset=" + offset, {
        cache:"no-store", signal:AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error("Project list unavailable");
      const {items, has_more: hasMore} = await response.json();
      if (version !== generation) return;
      for (const project of items) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        const title = document.createElement("strong");
        const meta = document.createElement("span");
        const state = document.createElement("span");
        link.href = "/recommendations?analysis=" + encodeURIComponent(project.analysis_id);
        title.textContent = project.title || (project.mode === "transcription" ? "음성 전사" : "쇼츠 프로젝트");
        state.className = "studio-project-status";
        state.dataset.state = project.status;
        state.textContent = states[project.status] || "상태 확인 필요";
        meta.textContent = [date.format(new Date(project.created_at)),
          project.candidate_count ? project.candidate_count + "개 후보" : null].filter(Boolean).join(" · ");
        link.append(state, title, meta);
        item.append(link);
        list.append(item);
      }
      offset += items.length;
      status.textContent = offset ? "" : "아직 프로젝트가 없습니다. 위에서 영상 분석을 시작하세요.";
      more.textContent = "프로젝트 더 보기";
      more.hidden = !hasMore;
    } catch {
      if (version !== generation) return;
      status.textContent = "프로젝트 목록을 불러오지 못했습니다.";
      more.textContent = "프로젝트 다시 조회";
      more.hidden = false;
    } finally {
      if (version === generation) more.disabled = false;
    }
  }
  function openList() {
    if (!new URLSearchParams(location.search).has("analysis")) load(true);
  }
  more.onclick = () => load();
  addEventListener("pageshow", openList);
  addEventListener("popstate", openList);
})();
