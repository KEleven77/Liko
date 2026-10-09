export function listenForOutsideDismiss({
  isInside,
  onDismiss,
  onOutsidePress,
  target = document,
}: {
  isInside: (target: EventTarget | null) => boolean;
  onDismiss: () => void;
  onOutsidePress?: () => void;
  target?: EventTarget;
}) {
  const consume = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const onPress = (event: Event) => {
    if (isInside(event.target)) return;
    consume(event);
    onOutsidePress?.();
  };
  const onClick = (event: Event) => {
    if (isInside(event.target)) return;
    consume(event);
    // Keep the popover mounted through pointerdown, so the later click cannot leak.
    onDismiss();
  };
  const presses = ["pointerdown", "mousedown", "pointerup", "mouseup"];
  const clicks = ["click", "auxclick", "contextmenu"];
  const options = { capture: true };
  for (const type of presses) target.addEventListener(type, onPress, options);
  for (const type of clicks) target.addEventListener(type, onClick, options);
  return () => {
    for (const type of presses) target.removeEventListener(type, onPress, options);
    for (const type of clicks) target.removeEventListener(type, onClick, options);
  };
}
