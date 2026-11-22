extends Control

## Optional path to the next scene (e.g. Popochiu's main scene or first room).
## Leave empty while testing the splash screen on its own.
@export_file("*.tscn") var next_scene_path: String = ""
@export var fade_in_duration: float = 1.2
@export var fade_out_duration: float = 0.8

@onready var _title_label: Label = %TitleLabel
@onready var _prompt_label: Label = %PromptLabel
@onready var _fade_overlay: ColorRect = %FadeOverlay

var _can_continue: bool = false
var _transitioning: bool = false


func _ready() -> void:
	_fade_overlay.color = Color(0.0, 0.0, 0.0, 1.0)
	_title_label.modulate.a = 0.0
	_prompt_label.modulate.a = 0.0

	var tween := create_tween()
	tween.tween_property(_fade_overlay, "color:a", 0.0, fade_in_duration)
	tween.tween_property(_title_label, "modulate:a", 1.0, 0.8)
	tween.tween_callback(_on_intro_finished)


func _on_intro_finished() -> void:
	_can_continue = true
	var pulse := create_tween().set_loops()
	pulse.tween_property(_prompt_label, "modulate:a", 0.9, 0.9)
	pulse.tween_property(_prompt_label, "modulate:a", 0.25, 0.9)


func _unhandled_input(event: InputEvent) -> void:
	if not _can_continue or _transitioning:
		return

	var is_press := (
		(event is InputEventMouseButton and event.pressed)
		or (event is InputEventKey and event.pressed and not event.echo)
	)
	if is_press:
		_start_transition()


func _start_transition() -> void:
	_transitioning = true
	var tween := create_tween()
	tween.tween_property(_fade_overlay, "color:a", 1.0, fade_out_duration)
	tween.tween_callback(_on_fade_out_finished)


func _on_fade_out_finished() -> void:
	if next_scene_path != "" and ResourceLoader.exists(next_scene_path):
		get_tree().change_scene_to_file(next_scene_path)
	else:
		# No next scene configured yet: fade back in so the splash screen can be previewed again.
		_transitioning = false
		var tween := create_tween()
		tween.tween_property(_fade_overlay, "color:a", 0.0, fade_in_duration)
