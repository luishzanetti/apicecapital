#!/usr/bin/env python3
"""
Apice Capital — Nano-Banana Runner
===================================

Generates 6 expert portraits via Google Gemini 2.5 Flash Image.

Prerequisites:
    pip install google-genai pillow
    export GEMINI_API_KEY="your_key_from_https://aistudio.google.com/apikey"

Usage:
    python nano-banana-runner.py --all                      # generate 4 variants per expert
    python nano-banana-runner.py --all --variants 2         # 2 variants each
    python nano-banana-runner.py --expert nora              # single expert
    python nora-banana-runner.py --expert elena --variants 6
    python nano-banana-runner.py --list                     # just list experts

Output:
    Saved to ../assets/experts/real/{name}-v{n}-{timestamp}.png
    Relative to the location of this script.

Author: @media-engineer, Apice Capital · 2026-04-17
"""

from __future__ import annotations

import argparse
import base64
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


# -----------------------------------------------------------------------------
# Master style constraint — applied to every expert prompt
# -----------------------------------------------------------------------------

MASTER_STYLE = """\
STYLE: Semi-photorealistic editorial portrait, digital painting with photographic weight. The register is private-banking-meets-Anthropic: calm confidence, quiet intelligence, human warmth without performative smile. Think New Yorker online editorial portraiture, MIT Tech Review feature photography, Stripe Sessions speaker headshots. NOT stock photography, NOT anime, NOT 3D render, NOT cartoon, NOT corporate-cold.

FRAMING: Chest-up portrait, single subject, centered with subtle weight to one side per character. Shoulders and upper torso visible. Hands not in frame.

LENS: Emulate 85mm prime lens at f/2.8. Soft depth-of-field fall-off toward background. Sharp focus on the eyes.

LIGHTING: Single warm key light from camera-left at 35°, soft fill from the right, subtle cool rim light separating shoulders from background. Cinematic, never harsh. Skin reads warm and living, not plasticky.

BACKGROUND: Soft warm-neutral gradient, sandy cream (#F7F3ED) at bottom blending to a deeper warm shadow at the edges. NO literal scenes, NO offices, NO trading floors, NO laptops, NO charts on walls, NO city windows. The background is atmosphere, not location.

PALETTE CONSTRAINT: Predominantly warm neutrals — cream, sand, soft taupe. Each subject carries ONE visible but subtle accent of their signature color (specified per expert below). The Apice brand emerald (#16A661) must appear as a tiny accent somewhere — a pin, a ring, a visible lining — but never dominant, never obvious.

EXPRESSION: Composed and thoughtful. Gentle engaged gaze with the viewer. NOT smiling wide — a faint trace of warmth at the corner of the mouth is allowed. Never laughing, never frowning, never dramatic. Interior stillness.

WARDROBE PRINCIPLE: Modern professional with personal signature. NOT a stiff suit, NOT business-casual-generic. Each expert's wardrobe expresses their archetype. Natural fabrics: wool, linen, cotton, fine knits. Neutral base with one accent touch.

NEGATIVE — do not generate any of: crypto iconography, coins, Bitcoin logos, laser eyes, neon lights, trading floor imagery, multiple monitors, stock graphs, Bloomberg orange, dollar signs, gold chains, rolex watches visible, flashy jewelry, clown colors, corporate stock-photo smile, suit-and-tie obvious banker look, messy hair, wrinkled clothes, oversaturated colors, HDR hyperrealism, grainy film look, anime proportions, exaggerated features, cartoon eyes, text, watermarks, logos.

OUTPUT: Single portrait, high quality, aspect ratio 1:1 square."""


# -----------------------------------------------------------------------------
# The 6 expert prompts
# -----------------------------------------------------------------------------

@dataclass
class Expert:
    name: str
    title: str
    accent_hex: str
    prompt: str


EXPERTS: dict[str, Expert] = {
    "nora": Expert(
        name="nora",
        title="the Thesis Builder",
        accent_hex="#8B5CF6",
        prompt="""SUBJECT: Nora, the Thesis Builder. A woman in her early-to-mid 40s. European-Scandinavian features with warm undertones — think a woman whose family moved from Stockholm to Milan a generation ago. Softly angular face, intelligent grey-green eyes behind thin wire-frame reading glasses resting low on the nose. Medium-length straight chestnut-brown hair with quiet auburn highlights, pulled half-back in a loose low twist. Minimal makeup: neutral warm tone, a whisper of warm rose on the lips.

EXPRESSION: Composed, slightly inquisitive — she is listening to something she is about to thoughtfully disagree with. Tiny lift at the corner of the left side of her mouth. Direct eye contact with the viewer.

WARDROBE: A deep indigo fine merino turtleneck under an unstructured oatmeal wool blazer, collar softly rolled. NO tie. A single slim silver ring on the middle finger (hand not in frame, but implied in posture). The indigo reads as the only cool note in an otherwise warm composition — this is her signature.

POSTURE: Shoulders squared but relaxed. Slight forward lean. She is present with the viewer, not posing.

ACCENT TOUCHES: A tiny emerald pin on the blazer's left lapel — barely visible, the Apice signature. The indigo of the turtleneck is her personal accent — warm indigo, leaning toward deep violet rather than electric.

MOOD: Quiet authority. A senior analyst who has seen three crypto cycles and is unfazed. She has a thesis. She is not selling it.

FRAMING: Chest-up, slight 1/8 turn to her right (viewer's left), eyes to camera. Background: cream-to-warm-shadow gradient, painterly soft-focus.""",
    ),
    "kai": Expert(
        name="kai",
        title="the Pattern Reader",
        accent_hex="#0EA5E9",
        prompt="""SUBJECT: Kai, the Pattern Reader. A person in their early 30s with a deliberately androgynous presentation — features that read as neither strongly masculine nor strongly feminine. East Asian and Pacific Islander heritage, warm golden-olive skin tone. Sharp cheekbones, alert almond-shaped dark brown eyes with a subtle underlining of minimal eyeliner. Eyebrows clean and natural. Short textured haircut with a slight sweep — jet black with a faint cool undertone, styled with a matte product so individual strands catch light.

EXPRESSION: Alert but calm — the moment just before they notice something in a chart that others missed. Brows relaxed, eyes slightly narrowed in focus. Lips neutral, closed, faint hint of a half-smile suggestion at the right corner. They are reading you the way they read a tape.

WARDROBE: A charcoal technical knit crewneck (merino-poly blend) with a fine cable texture, paired with a soft navy unstructured overshirt open at the front. A thin sky-blue silk scarf loosely tucked at the neckline — barely visible but deliberate, their signature accent. NO visible logos. No tie.

POSTURE: 3/4 turn to camera-right (their left), shoulders squared, head returning toward the viewer. Lean and composed.

ACCENT TOUCHES: The sky-blue scarf lining is the only non-neutral color in the composition. A small matte emerald stud in the left ear — the Apice signature, subtle.

MOOD: Pattern recognition. Disciplined alertness. Not a trader on a floor — a researcher in a quiet studio who happens to move markets.

FRAMING: Chest-up, 3/4 turn, eyes to camera. Background: soft gradient from warm cream to slightly cooler shadow on the subject's right side, suggesting late-afternoon north-facing window light.""",
    ),
    "elena": Expert(
        name="elena",
        title="the Patient Compounder",
        accent_hex="#16A661",
        prompt="""SUBJECT: Elena, the Patient Compounder. A woman in her early-to-mid 40s. Mediterranean features — think northern Italian or southern French heritage. Warm olive-sand skin tone with natural softness. Long, gently wavy dark brown hair with sun-touched auburn lowlights, worn loose and falling just past the shoulders — uncurated but well cared for. Warm hazel eyes with faint smile lines that read as earned, not cosmetic. No heavy makeup: a warm bronze on the eyelids, natural lip.

EXPRESSION: Serene and grounded. A small, genuine half-smile that barely lifts the lips — the smile of someone who has been proven right by time and does not need to prove it again. Direct, patient eye contact. Not inviting. Steady.

WARDROBE: A soft sage-emerald fine cashmere sweater (emerald leaning toward muted, NOT neon) with a shallow V-neck. Underneath, a simple cream camisole barely visible at the collar. A small gold pendant necklace resting against the sternum — one tiny green stone at its center. Natural cotton-linen weave visible in the sweater texture.

POSTURE: Squared to camera, shoulders relaxed and open. The most anchored of the six. She does not lean forward or back.

ACCENT TOUCHES: The sweater itself IS her accent — sage-emerald aligned with the Apice brand (around #2A8F5D, slightly deeper than pure brand emerald). The tiny green stone in the pendant is the only saturated emerald on her — Apice signature. No other visible jewelry except a simple warm-gold hoop in each ear.

MOOD: Unshakeable patience. She has run the same weekly buy for 12 years. The market has panicked around her four times. She did not.

FRAMING: Chest-up, fully forward, eyes to camera. Background: warm cream that deepens to golden-taupe in the corners, suggesting late-afternoon sun.""",
    ),
    "dante": Expert(
        name="dante",
        title="the Risk Architect",
        accent_hex="#F43F5E",
        prompt="""SUBJECT: Dante, the Risk Architect. A man in his mid-to-late 40s. Mediterranean features — Italian heritage with a hint of Greek. Olive skin, closely-trimmed dark beard showing the first silvers at the chin and sideburns — deliberate, maintained. Short-cropped dark hair with natural graying at the temples. Direct slate-grey eyes under calm brows. Strong jawline, a small faint scar along the right eyebrow that reads as history, not threat. No rings, no watch visible.

EXPRESSION: Calm and attentive. The slightest narrowing of the eyes — he is assessing. The mouth is neutral and set. He is not suspicious of the viewer; he is measuring. The expression of a man who has told investors "no" more often than "yes" and does not apologize for it.

WARDROBE: A graphite-charcoal fine wool roll-neck (structural, not bulky), over which sits an unstructured dark slate-grey wool overshirt — buttoned halfway. NO tie. NO visible pocket square. The rose accent appears ONLY as a thin dusty-rose hairline pin on the overshirt's inside lapel fold — barely visible, deliberate. Everything else is graphite and shadow.

POSTURE: Squared to camera. Shoulders deliberately placed, spine straight but not rigid. The composition is the most vertical of the six.

ACCENT TOUCHES: The dusty-rose pin is his signature — sparing, inward, almost a secret. A small Apice emerald rivet on the overshirt's sleeve cuff — tiny, precise, easily missed.

MOOD: Protective. Not threatening. The ex-military risk officer who became a family-office partner. He would take a loss so that you would not.

FRAMING: Chest-up, full forward, eyes to camera. Background: cool-to-neutral gradient, slate grey blending to warm shadow at the edges — the coolest background of the six, reinforcing his protective register.""",
    ),
    "maya": Expert(
        name="maya",
        title="the Deep Researcher",
        accent_hex="#8E4CBF",
        prompt="""SUBJECT: Maya, the Deep Researcher. A woman in her late 20s / early 30s. South Asian heritage (Indian or Indian-American), warm tan skin tone with golden undertones. Long-ish dark hair with natural waves, pulled loosely behind one ear, revealing a small silver hoop earring. Expressive deep brown eyes behind vintage round thin-frame glasses in matte black — curiosity made visible. Natural brows, a small nose ring (tiny silver stud, right nostril). Minimal makeup: skin-true base, a faint berry on the lips.

EXPRESSION: Sharp-focused curiosity — the millisecond after she sees a data point that makes her reframe an entire thesis. Eyebrows lifted a fraction, lips slightly parted with the word she is about to say, eyes direct and live. More energy than any of the other five, but still composed.

WARDROBE: A deep plum / dusty-purple oversized cashmere turtleneck (loose, comfortable, real — not photoshoot-crisp), sleeves pushed to the forearms (sleeves not in frame). Small silver chain necklace with a delicate geometric pendant — a minimalist constellation motif, three dots connected by thin lines.

POSTURE: 3/4 turn to camera-left (her right). Slight forward lean — she is engaged with the viewer, about to ask or tell something. The most energized posture of the six without being theatrical.

ACCENT TOUCHES: The plum-purple sweater is her signature. The constellation pendant is a tiny node-graph — it ties to her researcher identity. A nearly-invisible emerald dot worked into the clasp of the necklace at the back of her neck — the Apice signature, just out of focus.

MOOD: Contrarian intelligence. She reads on-chain data for fun. She is the youngest of the six and the most likely to disagree with the other five.

FRAMING: Chest-up, 3/4 turn, head returning to camera. Background: warm cream with a slightly cooler purple-grey shadow on the right, suggesting a window on her right side.""",
    ),
    "omar": Expert(
        name="omar",
        title="the Mentor",
        accent_hex="#D9912D",
        prompt="""SUBJECT: Omar, the Mentor. A man in his mid 50s. North African / Middle Eastern heritage — think Moroccan or Lebanese lineage. Warm sand-brown skin with the quiet glow of someone who spends time outdoors. Closely trimmed salt-and-pepper beard (more salt than pepper at the chin, more pepper at the jaw) — deliberate, kempt. Short curly hair, mostly silver-gray now, with black at the temples. Deep-set warm brown eyes with genuine laugh lines at the outer corners — these are his most defining feature. Gentle brows.

EXPRESSION: This is the warmest expression of the six. A genuine, soft, un-performed half-smile — the smile of a professor greeting a returning student. Eyes engaged, slightly creased at the corners. This is the single expression where "warm" crosses into "openly welcoming." Never a full grin — dignified warmth.

WARDROBE: A soft camel-and-cream natural linen shirt, collar open, top button undone — relaxed, honest. Over it, an unstructured warm-amber wool cardigan (the amber is his signature accent — earthy, not neon). Sleeves pushed to mid-forearm (out of frame). A thin brown leather cord necklace with a small wooden bead resting at the sternum.

POSTURE: Squared to camera, slightly turned 1/8 to his left. Shoulders relaxed, posture open. He is inviting the viewer in.

ACCENT TOUCHES: The amber cardigan is his signature. A small Apice emerald thread stitched along the cardigan's inside placket — the brand signature, quiet, inward. A simple open book barely visible in soft-focus at the lower edge of the frame — suggested, not literal (MUST be painterly-blurred, not a stock photo book).

MOOD: Approachable wisdom. The favorite professor who also happens to invest seriously. Patience made visible.

FRAMING: Chest-up, fully forward with slight 1/8 turn, eyes to camera. Background: rich warm cream deepening to honeyed amber at the edges — the warmest background of the six.""",
    ),
}


# -----------------------------------------------------------------------------
# Gemini API call
# -----------------------------------------------------------------------------

def build_full_prompt(expert: Expert) -> str:
    """Concatenate master style constraint + per-expert prompt."""
    return f"{MASTER_STYLE}\n\n{expert.prompt}"


def generate_image(expert: Expert, output_path: Path, api_key: str) -> bool:
    """
    Generate a single image via the google-genai SDK.
    Returns True on success, False on failure.
    """
    try:
        # Lazy-import so the script can still `--list` without the SDK installed
        from google import genai
        from google.genai import types
    except ImportError:
        print("ERROR: google-genai not installed. Run: pip install google-genai", file=sys.stderr)
        return False

    client = genai.Client(api_key=api_key)
    prompt = build_full_prompt(expert)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                temperature=1.0,
            ),
        )
    except Exception as exc:
        print(f"  ✗ API error for {expert.name}: {exc}", file=sys.stderr)
        return False

    # Extract the inline image bytes
    try:
        for candidate in response.candidates:
            for part in candidate.content.parts:
                if getattr(part, "inline_data", None) and part.inline_data.data:
                    data = part.inline_data.data
                    # SDK returns bytes or base64 str depending on version — handle both
                    if isinstance(data, str):
                        data = base64.b64decode(data)
                    output_path.parent.mkdir(parents=True, exist_ok=True)
                    output_path.write_bytes(data)
                    return True
        print(f"  ✗ No image data in response for {expert.name}", file=sys.stderr)
        return False
    except Exception as exc:
        print(f"  ✗ Could not extract image data for {expert.name}: {exc}", file=sys.stderr)
        return False


# -----------------------------------------------------------------------------
# Batch orchestration
# -----------------------------------------------------------------------------

def run_batch(selected_experts: list[Expert], variants: int, output_dir: Path, api_key: str) -> None:
    total_requested = len(selected_experts) * variants
    total_succeeded = 0
    start = time.time()
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    print(f"\nGenerating {total_requested} images")
    print(f"   Experts: {', '.join(e.name for e in selected_experts)}")
    print(f"   Variants per expert: {variants}")
    print(f"   Output: {output_dir}\n")

    for expert in selected_experts:
        print(f"→ {expert.name} ({expert.title})")
        for i in range(1, variants + 1):
            filename = f"{expert.name}-v{i}-{timestamp}.png"
            output_path = output_dir / filename
            print(f"  · variant {i}/{variants} → {filename}", end=" ", flush=True)
            t0 = time.time()
            ok = generate_image(expert, output_path, api_key)
            dt = time.time() - t0
            if ok:
                size_kb = output_path.stat().st_size / 1024
                print(f"✓ {dt:.1f}s, {size_kb:.0f} KB")
                total_succeeded += 1
            else:
                print(f"✗ {dt:.1f}s")

    elapsed = time.time() - start
    cost_per_image = 0.039
    total_cost = total_succeeded * cost_per_image

    print("\n" + "=" * 60)
    print(f"Summary")
    print(f"   Succeeded: {total_succeeded}/{total_requested}")
    print(f"   Elapsed:   {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"   Est cost:  ${total_cost:.2f} USD")
    print(f"   Output:    {output_dir}")
    print("=" * 60)


# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Apice expert portraits via Google Gemini 2.5 Flash Image.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--all", action="store_true", help="Generate all 6 experts")
    group.add_argument("--expert", type=str, help=f"Single expert: {', '.join(EXPERTS.keys())}")
    group.add_argument("--list", action="store_true", help="List available experts and exit")
    parser.add_argument("--variants", type=int, default=4, help="Variants per expert (default: 4)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Output directory (default: ../assets/experts/real relative to this script)",
    )

    args = parser.parse_args()

    if args.list:
        print("\nAvailable experts:")
        for key, e in EXPERTS.items():
            print(f"  {key:8}  {e.title:25}  accent {e.accent_hex}")
        print()
        return 0

    # Resolve output dir
    script_dir = Path(__file__).resolve().parent
    output_dir = args.output_dir or (script_dir.parent / "assets" / "experts" / "real").resolve()

    # Resolve API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: set GEMINI_API_KEY env var. Get a key at https://aistudio.google.com/apikey", file=sys.stderr)
        return 1

    # Select experts
    if args.all:
        selected = list(EXPERTS.values())
    else:
        key = args.expert.lower().strip()
        if key not in EXPERTS:
            print(f"ERROR: unknown expert '{key}'. Valid: {', '.join(EXPERTS.keys())}", file=sys.stderr)
            return 1
        selected = [EXPERTS[key]]

    if args.variants < 1 or args.variants > 12:
        print("ERROR: --variants must be between 1 and 12", file=sys.stderr)
        return 1

    run_batch(selected, args.variants, output_dir, api_key)
    return 0


if __name__ == "__main__":
    sys.exit(main())
