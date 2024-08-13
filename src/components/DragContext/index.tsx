import {
	createComputed,
	createContext,
	JSX,
	onCleanup,
	onMount,
	useContext,
} from "solid-js";
import { DOMElement } from "solid-js/jsx-runtime";
import { createStore, SetStoreFunction } from "solid-js/store";

export type DragId = string | number;

export type DragContextDetails = {
	draggedId: DragId;
	draggedOverId: DragId;
	draggedType: string;
	draggedOverType: string;
};

export type DragContextProps = {
	details: DragContextDetails;
	updateDetails: SetStoreFunction<DragContextProps["details"]>;
	refObj: Record<DragId, HTMLElement>;
	setRefObj: SetStoreFunction<DragContextProps["refObj"]>;
	controller: AbortController;
};

const DragContext = createContext<DragContextProps>();

type DragProviderProps = {
	children: JSX.Element;
	defaultValue: DragContextDetails;
};
export const DragProvider = (props: DragProviderProps) => {
	const [details, updateDetails] = createStore(props.defaultValue);
	const [refObj, setRefObj] = createStore<Record<DragId, HTMLElement>>({});

	const controller = new AbortController();

	return (
		<DragContext.Provider
			value={{
				details,
				updateDetails,
				refObj,
				setRefObj,
				controller,
			}}
		>
			{props.children}
		</DragContext.Provider>
	);
};

export const useDragContext = () => {
	//
	const ctx = useContext(DragContext);

	if (!ctx) {
		throw new Error(
			"Drag context is undefined." +
				"Make sure to use it within a provider " +
				"and provide a default value"
		);
	}

	return ctx;
};

export type UseDraggableProps = {
	id: DragId;
	nodeRef?: HTMLElement;
	onDragEnd?: (e: MouseEvent, details: DragContextDetails) => void;
};
export const useDraggable = (props: UseDraggableProps) => {
	const ctx = useDragContext();
	const [transform, setTransform] = createStore({ x: 0, y: 0 });

	const mouseDownPosition: {
		x: number;
		y: number;
	} = {
		x: 0,
		y: 0,
	};
	// const [mouseDownPosition, setMouseDownPosition] = createStore<{
	// 	x: number | null;
	// 	y: number | null;
	// }>({
	// 	x: null,
	// 	y: null,
	// });

	// createComputed(() => {
	// 	if (!props.nodeRef || !ctx) return;
	// 	ctx.setRefObj(props.id, props.nodeRef);
	// });

	onCleanup(() => {
		ctx.setRefObj((prev) => {
			const copy = { ...prev };
			delete copy[props.id];
			return copy;
		});
	});

	const setNodeRef = (ref: HTMLElement) => {
		ctx.setRefObj(props.id, ref);
	};

	const onMouseMove = (e: MouseEvent) => {
		const { draggedId } = ctx.details;
		if (!draggedId && draggedId !== 0) return;
		const draggedEl = ctx.refObj[draggedId];
		if (!draggedEl) return;
		const { x: mdx, y: mdy } = mouseDownPosition;
		// console.log("mouseDownPosition: ", mdx, mdy);
		if (mdx === null || mdy === null) return;
		setTransform((_) => ({ x: e.pageX - mdx, y: e.pageY - mdy }));
	};

	const onMouseUp = (e: MouseEvent) => {
		console.log("mouse up");
		props.onDragEnd && props.onDragEnd(e, ctx.details);
		const { draggedId } = ctx.details;
		const draggedEl = ctx.refObj[draggedId];
		if (!draggedEl) return;
		draggedEl.style.zIndex = "0";
		draggedEl.style.pointerEvents = "all";
		ctx.updateDetails((prev) => ({
			...prev,
			draggedId: "",
			draggedOverId: "",
		}));
		setTransform({ x: 0, y: 0 });
		// remove all listeners just in case
		document.removeEventListener("mouseleave", onMouseUp);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
	};

	const onMouseDown = (e: MouseEvent) => {
		console.log("mouse down");
		ctx.updateDetails("draggedId", props.id);
		mouseDownPosition.x = e.pageX;
		mouseDownPosition.y = e.pageY;
		// remove all listeners just in case
		document.removeEventListener("mouseleave", onMouseUp);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		// add listeners to document
		document.addEventListener("mouseleave", onMouseUp);
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
		const { draggedId } = ctx.details;
		const draggedEl = ctx.refObj[draggedId];
		if (!draggedEl) return;
		draggedEl.style.zIndex = "999";
		draggedEl.style.pointerEvents = "none";
	};

	const onMouseOver = (e: MouseEvent) => {
		const { draggedId } = ctx.details;
		if (!draggedId && draggedId !== 0) return;
		if (draggedId === props.id) return;
		ctx.updateDetails("draggedOverId", props.id);
		const el = ctx.refObj[props.id];
		const draggedEl = ctx.refObj[draggedId];
		if (!el || !draggedEl) return;
		const placeholderEl = draggedEl.cloneNode() as HTMLElement;
		// placeholderEl.style.position = 'static';
		placeholderEl.style.translate = "0 0";
		el.insertAdjacentElement("afterend", placeholderEl);
	};

	onMount(() => {
		const el = ctx.refObj[props.id];
		if (!el) return;
		el.addEventListener("mouseover", onMouseOver);
		console.log("added");
	});

	const listeners = { onMouseDown };

	return {
		listeners,
		setNodeRef,
		transform,
	};
};
