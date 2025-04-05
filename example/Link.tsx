import { AnchorHTMLAttributes, useCallback, useMemo } from "react";
import { DetailedHTMLProps } from "react";
import { push, useIsActivePath } from "../src/useUrl";

type AnchorProps = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

type Config = { active: boolean };

type LinkProps = Omit<AnchorProps, "className" | "style" | "children"> & {
  href: string;
  className?:
    | AnchorProps["className"]
    | ((config: Config) => AnchorProps["className"]);
  style?: AnchorProps["style"] | ((config: Config) => AnchorProps["style"]);
  children?:
    | AnchorProps["children"]
    | ((config: Config) => AnchorProps["children"]);
};

export const Link = ({
  className,
  style,
  onClick: originalOnClick,
  href,
  children,
  download,
  target,
  ...props
}: LinkProps) => {
  const isActive = useIsActivePath(href);

  const config = useMemo<Config>(() => ({ active: isActive }), [isActive]);

  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      const url = new URL(event.currentTarget.href);
      const currentLocation = new URL(window.location.href);
      const hasDifferentOrigin = url.origin !== currentLocation.origin;
      const hasModifier = download != undefined || target != undefined;
      const hasMetaKey = event.metaKey || event.ctrlKey;

      const shouldRunDefaultBehavior =
        hasDifferentOrigin || hasModifier || hasMetaKey;

      if (!shouldRunDefaultBehavior) {
        event.preventDefault();
        push(href);
      }

      if (originalOnClick != undefined) {
        originalOnClick(event);
      }
    },
    [originalOnClick, download, target]
  );

  return (
    <a
      style={typeof style === "function" ? style(config) : style}
      className={
        typeof className === "function" ? className(config) : className
      }
      onClick={onClick}
      download={download}
      target={target}
      href={href}
      {...props}
    >
      {typeof children === "function" ? children(config) : children}
    </a>
  );
};
