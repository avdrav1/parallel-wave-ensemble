// Keeps one sound source active at a time. Each source announces when it
// starts; every other source listens and fades or pauses itself.
const bus = new EventTarget();

export function announceSoundStart(source) {
  bus.dispatchEvent(new CustomEvent('soundstart', { detail: { source } }));
}

export function onOtherSoundStart(source, callback) {
  bus.addEventListener('soundstart', (event) => {
    if (event.detail.source !== source) callback();
  });
}
