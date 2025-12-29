export const PROMPT_ARRAY = [
  `Analyze the upper body of the person to verify Shirt Compliance.
Task: Perform a visual scan of 3 Zones: Waist, Arms, and Chest. Use the provided INSTRUCTIONS to minimize errors.

ZONE 1: WAIST (Tucking Check)
Goal: Verify if the shirt is tucked into the pants.
## INSTRUCTION:
• Find the Belt Line: Look for the horizontal line where the shirt meets the pants.
• Logic Check:
If you see a Belt or the Waistband of the pants clearly overlaying the shirt fabric -> Result is TUCKED (PASS).
If the shirt fabric continues down past the waist, covering the zipper/pockets area -> Result is UNTUCKED (FAIL).
Note: A slight 'blousing' (loose fabric above the belt) is normal. Do not mark it as untucked unless the hem is out.
ZONE 2: ARMS (Sleeve Check)
Goal: Identify sleeve type and neatness.
## INSTRUCTION:
• Distinguish Type:
Fabric ends at/above the elbow + Bare forearm visible -> Short Sleeve.
Fabric extends to the wrist -> Long Sleeve.
• Neatness Logic:
For Long Sleeves: Look at the wrist. Is there a buttoned cuff (Neat)? Or is the fabric rolled up creating a thick, uneven bunch (Messy)?
Rule: Rolled-up sleeves are only allowed if they are folded neatly and evenly. Random bunching is a FAIL.
ZONE 3: CHEST (Name Tag/Badge Check)
Goal: Detect the presence of the ID Badge.
## INSTRUCTION:
• Visual Cues: Look for a small, rectangular object on the chest (usually Left Chest). It is distinct from the shirt fabric.
• Handling Glare/Blur:
If you see a Metallic shine or a White rectangular patch that reflects light -> Count it as DETECTED.
Do not confuse a 'Shirt Pocket' with a 'Badge'. A badge is attached on top of the shirt/pocket.
If the chest area is completely plain white -> NOT DETECTED.

FINAL OUTPUT:
Based on the instructions above, return strictly valid JSON:
{
"waist_analysis": {
"belt_visible": boolean,
"shirt_hem_status": "tucked_in" | "hanging_out",
"is_compliant": boolean
},
"sleeve_analysis": {
"type": "short" | "long",
"condition": "neat_cuff" | "neat_roll" | "messy_bunch",
"is_compliant": boolean
},
"badge_analysis": {
"object_detected": boolean,
"notes": "string (e.g., 'Shiny rectangle found' or 'Only pocket visible')"
},
"overall_shirt_result": "PASS" | "FAIL"
}`,

  `Analyze the trousers/pants in the image strictly against these Railway Uniform Rules:
Rule A: Must be Formal Trousers (Slacks). NO Jeans, NO Khakis, NO Joggers.
Rule B: Must be Dark Color (Black or Navy Blue).
Rule C: Hem must fall straight down. NO rolled-up legs (cuffs).
Perform a step-by-step visual scan:
1. Fabric & Style Scan:
Look for denim texture, rivets, or external pockets. If found -> It is Jeans (FAIL).
Look for a center crease line. If found -> It is Formal (PASS).
2. Color Scan:
Is the color Black, Dark Blue, or Navy? (PASS).
Is it Light Grey, Beige, or Bright colors? (FAIL).
3. Hemline & Ankle Scan:
Look at the bottom of the pants. Is the fabric manually folded or rolled up?
Is there a thick, bulky ring of fabric around the ankle?
Are the ankles significantly exposed?
If any of the above is YES -> It is Rolled Up (FAIL).
Conclusion:
Return the result as a JSON object strictly:
{
"is_jeans_or_denim": boolean,
"is_dark_formal_color": boolean,
"is_rolled_up": boolean,
"overall_compliant": boolean,
"reason": "Brief explanation of the main failure"
}`,

  `Analyze the feet/footwear in the image strictly.
Standard: Must wear Clean, Polished, Black Formal Leather Shoes.
Perform a visual scan using these 4 LAYERS OF INSPECTION:
LAYER 1: PRESENCE CHECK (The 'Barefoot' Filter)
Goal: Ensure the employee is actually wearing shoes.
## INSTRUCTION:
Look at the feet.
FAIL: Do you see bare skin (toes, heel)? Do you see only socks (soft fabric texture, foot shape visible)?
PASS: Is there a rigid, external footwear object covering the foot?
LAYER 2: STRUCTURE CHECK (The 'Sandal' Filter)
Goal: Eliminate open footwear.
## INSTRUCTION:
FAIL (Sandal): Do you see straps, gaps, or holes revealing the socks/skin inside?
PASS (Shoe): Is it a solid, enclosed shell?
LAYER 3: STYLE CHECK (The 'Sneaker' Filter)
Goal: Eliminate sporty footwear.
## INSTRUCTION:
FAIL (Sneaker): Look for thick white rubber soles, mesh fabric, or large sport logos.
PASS (Formal): Look for smooth leather surface and a distinct heel block.
LAYER 4: CONDITION CHECK (The 'Cleanliness' Check)
Goal: Detect dirt, mud, or lack of maintenance.
## INSTRUCTION:
• Look at the surface of the shoe strictly.
• PASS (Clean): Is the surface uniform and shiny/polished?
• FAIL (Dirty):
Mud/Grime: Are there brown/grey patches of dried earth or mud on the shoe or sole edges?
Dusty: Is there a thick layer of grey dust making the black leather look dull/grey?
Scuffed: Are there visible scratches revealing the inner material?
FINAL OUTPUT:
Return strictly valid JSON:
{
"presence_check": {
"is_wearing_shoes": boolean,
"detected_object": "shoe" | "bare_feet" | "socks_only"
},
"style_check": {
"category": "formal_shoe" | "sneaker" | "sandal" | "unknown"
},
"cleanliness_check": {
"is_clean": boolean,
"condition": "polished" | "dusty" | "muddy" | "scuffed",
"shine_detected": boolean
},
"final_result": "COMPLIANT" | "NON_COMPLIANT",
"violation_reason": "string (e.g., 'Barefoot', 'Dirty Shoes', 'Sneakers', or 'None')"
}`,

  //   `Evaluate employee uniform focusing on:
  // 1. Brand/company standards compliance
  // 2. Accessories and additions
  // 3. Safety equipment if applicable

  // JSON format:
  // {
  //   "score": number,
  //   "status": "pass" | "warning" | "fail",
  //   "issues": ["issue1", "issue2", ...]
  // }`,
]
