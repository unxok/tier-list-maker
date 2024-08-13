import { createEffect, For, type Component, type JSX } from "solid-js";
import { DragId, DragProvider, useDraggable } from "./components/DragContext";

const items = ["apple", "orange", "banana", "grape"];

const App: Component = () => {
	return (
		<div class='fixed inset-0 flex flex-col justify-center items-center'>
			hello there
			<DragProvider
				defaultValue={{
					draggedId: "",
					draggedOverId: "",
					draggedType: "",
					draggedOverType: "",
				}}
			>
				<SortableContainer>
					<For each={items}>
						{(item, index) => (
							<Draggable id={index()}>
								<Card index={index()}>{item}</Card>
							</Draggable>
						)}
					</For>
				</SortableContainer>
			</DragProvider>
		</div>
	);
};

export default App;

type SortableContainerProps = {
	children: JSX.Element;
};
const SortableContainer: Component<SortableContainerProps> = (props) => {
	//
	return <div class='flex border rounded-md p-2'>{props.children}</div>;
};

type DraggableProps = {
	children: JSX.Element;
	id: DragId;
};
const Draggable: Component<DraggableProps> = (props) => {
	const dragged = useDraggable({
		id: props.id,
		onDragEnd: (e, details) => {
			console.log("dragged over: ", details.draggedOverId);
		},
	});

	return (
		<div
			ref={dragged.setNodeRef}
			style={{
				translate: dragged.transform.x + "px " + dragged.transform.y + "px",
			}}
		>
			<div>{props.children}</div>
			<button
				class='border bg-neutral-900 text-white rounded-lg p-1'
				{...dragged.listeners}
			>
				drag handle
			</button>
		</div>
	);
};

type CardProps = {
	children: JSX.Element;
	index: number;
};
const Card: Component<CardProps> = (props) => {
	//
	return (
		<div class='border p-1 rounded-sm'>
			<div class='text-lg font-bold'>{props.children}</div>
			<div class='text-sm italic'>id: {props.index}</div>
		</div>
	);
};
