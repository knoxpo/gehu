"use client";
import { GehuProvider } from "@gehu-js/react";
import type { ReactNode } from "react";

export function Providers({
	hydrate,
	children,
}: {
	hydrate: Record<string, unknown>;
	children: ReactNode;
}) {
	return <GehuProvider hydrate={hydrate}>{children}</GehuProvider>;
}
