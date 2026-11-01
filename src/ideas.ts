import './style.css';
import { AREAS, IDEAS, type IdeaArea } from './data/ideas';

// The ideas page: a plain list of what might come next, linked from the game's menu.
const root = document.querySelector<HTMLElement>('.ideas-list')!;
root.innerHTML = (Object.keys(AREAS) as IdeaArea[])
  .map((area) => {
    const ideas = IDEAS.filter((i) => i.area === area).sort((a, b) => (a.when === b.when ? 0 : a.when === 'next' ? -1 : 1));
    return `
      <section class="ideas-area card">
        <h2><span lang="ja">${AREAS[area].jp}</span> ${AREAS[area].title}</h2>
        <ul>${ideas
          .map(
            (i) => `
          <li>
            <h3>${i.title} <span class="idea-tag is-${i.when}">${i.when === 'next' ? 'Next up' : 'Later'}</span></h3>
            <p>${i.text}</p>
          </li>`,
          )
          .join('')}</ul>
      </section>`;
  })
  .join('');
