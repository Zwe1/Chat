export function handleStartLoading(e) {
  console.log('audio load start.');
}

export function handleError(e) {
  console.error('audio error.', e);
}

export function handleCanPlayThrough(e) {
  console.log('audio play through.', e);

  let $audio = e.target;
  $audio.paused && $audio.play();
}
