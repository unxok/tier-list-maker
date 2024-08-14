import {
	createEffect,
	createSignal,
	For,
	onMount,
	Setter,
	Show,
	type Component,
	type JSX,
} from "solid-js";
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
	attachClosestEdge,
	extractClosestEdge,
	Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { reorderWithEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge";
import { DropIndicator } from "./components/DragContext/DragIndicator";
import { cities, listItemGap } from "./utils/constants";

const fruit = ["apple", "orange", "banana", "grape"];

const App: Component = () => {
	const [items, setItems] = createSignal([...fruit], {});

	return (
		<div class='fixed inset-0 flex flex-col justify-center items-center'>
			<button onClick={() => setItems((prev) => [...prev, "pear"])}>
				add pear
			</button>
			<SortableList
				items={items()}
				setItems={setItems}
			>
				<For each={items()}>
					{(item, index) => (
						<Draggable id={index()}>
							<Card index={index()}>{item}</Card>
						</Draggable>
					)}
				</For>
			</SortableList>
		</div>
	);
};

export default App;

type SortableListProps = {
	children: JSX.Element;
	items: string[];
	setItems: Setter<SortableListProps["items"]>;
};
export const SortableList = (props: SortableListProps) => {
	createEffect(() => {
		monitorForElements({
			onDrop: ({ location, source }) => {
				const dropTarget = location.current.dropTargets[0];
				if (!dropTarget?.data || !source.data) return;
				if (dropTarget.data.id === source.data.id) return;
				// console.log("dragged: ", source.data);
				// console.log("target: ", dropTarget.data);
				props.setItems(
					reorderWithEdge({
						list: props.items,
						startIndex: source.data.id as number,
						indexOfTarget: dropTarget.data.id as number,
						closestEdgeOfTarget: extractClosestEdge(dropTarget.data),
						axis: "horizontal",
					})
				);
			},
		});
	});

	return (
		<div
			class='flex p-4 border rounded-md relative max-w-[90vw] overflow-x-auto'
			// style={{ gap: listItemGap }}
		>
			{props.children}
		</div>
	);
};

type DraggableProps = {
	children: JSX.Element;
	id: number;
};
export const Draggable = (props: DraggableProps) => {
	let ref: HTMLDivElement;
	const [isDragging, setDragging] = createSignal(false);
	const [isDraggedOver, setDraggedOver] = createSignal(false);
	const [closestEdge, setClosestEdge] = createSignal<Edge>("left");

	onMount(() => {
		draggable({
			element: ref,
			onDragStart: (args) => setDragging(true),
			onDrop: (args) => setDragging(false),
			getInitialData: (args) => ({ id: props.id }),
		});

		dropTargetForElements({
			element: ref,
			onDrag: (args) => {
				const edge = extractClosestEdge(args.self.data);
				setClosestEdge(edge ?? "right");
			},
			onDragEnter: (args) => {
				setDraggedOver(true);
				const edge = extractClosestEdge(args.self.data);
				console.log("edge: ", edge);
				setClosestEdge(edge ?? "right");
			},
			onDragLeave: (args) => setDraggedOver(false),
			onDrop: (args) => setDraggedOver(false),
			canDrop: (args) => args.source.data.id !== props.id,
			getData: ({ input, element }) => {
				const data = {
					id: props.id,
				};
				return attachClosestEdge(data, {
					input,
					element,
					allowedEdges: ["left", "right"],
				});
			},
		});
	});

	return (
		<>
			<div
				onDragStart={(e) => console.log("native drag start")}
				ref={(r) => (ref = r)}
				style={{
					opacity: isDragging() ? 0.5 : 1,
					padding: "0 calc(" + listItemGap + "* .5)",
					// filter: isDraggedOver() ? "invert()" : "none",
				}}
				class='relative touch-none'
			>
				{props.children}
				<Show when={isDraggedOver()}>
					<DropIndicator edge={closestEdge()} />
				</Show>
			</div>
		</>
	);
};

type CardProps = {
	children: JSX.Element;
	index: number;
};
const Card: Component<CardProps> = (props) => {
	//
	return (
		<div class='border p-1 rounded-sm whitespace-nowrap'>
			<div class='text-lg font-bold'>{props.children}</div>
			<div class='text-sm italic'>id: {props.index}</div>
		</div>
	);
};

// const DropIndicator = (props: { isActive: boolean }) => {
// 	//
// 	return (
// 		<span
// 			class='h-full w-0.5 bg-blue-500'
// 			style={{ opacity: props.isActive ? 1 : 0 }}
// 		></span>
// 	);
// };
