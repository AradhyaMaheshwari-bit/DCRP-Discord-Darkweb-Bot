export function formatTag(tag: string): string {
  return `Anon #${tag}`;
}

export function formatTimestamp(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const amPm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');

  return `${month}/${day}/${year} ${displayHours}:${minutes} ${amPm}`;
}

export function formatDarkwebMessage(tag: string, content: string, timestamp: Date): string {
  return [
    `🕸️ **DARKWEB**`,
    ``,
    `**${formatTag(tag)}**`,
    content,
    ``,
    `${formatTimestamp(timestamp)}`,
  ].join('\n');
}

export function formatCooldownRemaining(secondsLeft: number): string {
  if (secondsLeft <= 1) return '1 second';
  return `${Math.ceil(secondsLeft)} seconds`;
}
