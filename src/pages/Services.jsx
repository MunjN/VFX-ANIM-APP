import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const BRAND = {
  ink: "#1E2A78",
  fill: "#CFEFF7",
  bg: "#F7FBFE",
  text: "#111827",
  border: "#1E2A78",
};

const PAGE = {
  max: 1280,
};

const base = import.meta.env.VITE_API_BASE;

const SERVICES_DEFINITION =
"This is the list of services offered by the organization in the media creation process."
/**
 * Source-of-truth reference data (from your uploaded: services_hierarchy - Sheet7.csv)
 * Columns:
 *  SERVICE_ID, SERVICE_NAME, SERVICE_L1_ID, SERVICE_L1_NAME,
 *  SERVICE_L2_ID, SERVICE_L2_NAME, SERVICE_L3_ID, SERVICE_L3_NAME, DESCRIPTION
 */
export const SERVICES_REFERENCE = [
  {
    "SERVICE_ID": "5af24c14-2e68-4d90-bf8b-8f64d80d99c7",
    "SERVICE_NAME": "2D Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "5af24c14-2e68-4d90-bf8b-8f64d80d99c7",
    "SERVICE_L2_NAME": "2D Animation",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create animated content in a two-dimensional style, using flat drawings or vector art to produce motion on a flat plane."
  },
  {
    "SERVICE_ID": "67b568a8-4424-43da-a443-251af48c0cf6",
    "SERVICE_NAME": "Crowd Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "bf94c80c-bea9-44df-af62-ca02280b16e8",
    "SERVICE_L2_NAME": "3D Animation",
    "SERVICE_L3_ID": "67b568a8-4424-43da-a443-251af48c0cf6",
    "SERVICE_L3_NAME": "Crowd Animation",
    "DESCRIPTION": "Animate large groups of characters (crowds) for scenes, often using software to simulate group behavior so the crowd movement looks natural at scale."
  },
  {
    "SERVICE_ID": "988acf17-cbc1-41db-9c02-86d75606cc5b",
    "SERVICE_NAME": "Digital Doubles",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "bf94c80c-bea9-44df-af62-ca02280b16e8",
    "SERVICE_L2_NAME": "3D Animation",
    "SERVICE_L3_ID": "988acf17-cbc1-41db-9c02-86d75606cc5b",
    "SERVICE_L3_NAME": "Digital Doubles",
    "DESCRIPTION": "Create CGI replicas of real actors (or characters) for use in stunts, dangerous scenes, or VFX, ensuring the digital stand-ins move and appear like the real performers."
  },
  {
    "SERVICE_ID": "d3c33603-e2ff-4e06-b757-11352e91b649",
    "SERVICE_NAME": "Motion Capture",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "bf94c80c-bea9-44df-af62-ca02280b16e8",
    "SERVICE_L2_NAME": "3D Animation",
    "SERVICE_L3_ID": "d3c33603-e2ff-4e06-b757-11352e91b649",
    "SERVICE_L3_NAME": "Motion Capture",
    "DESCRIPTION": "Record the movements of real actors using sensors or markers, and transfer those motions to digital character models for highly realistic animation."
  },
  {
    "SERVICE_ID": "bf94c80c-bea9-44df-af62-ca02280b16e8",
    "SERVICE_NAME": "3D Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "bf94c80c-bea9-44df-af62-ca02280b16e8",
    "SERVICE_L2_NAME": "3D Animation",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Develop animated content with three-dimensional models, creating depth and immersive environments for a more lifelike visual experience."
  },
  {
    "SERVICE_ID": "5416c6c2-0baa-43aa-8c34-172754c45e14",
    "SERVICE_NAME": "Character Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "5416c6c2-0baa-43aa-8c34-172754c45e14",
    "SERVICE_L2_NAME": "Character Animation",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Animate individual characters by bringing their movements and expressions to life, injecting personality and emotion to make them believable on screen."
  },
  {
    "SERVICE_ID": "22adea4a-0511-4070-a8d8-9ef4f858fe03",
    "SERVICE_NAME": "Grooming",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "22adea4a-0511-4070-a8d8-9ef4f858fe03",
    "SERVICE_L2_NAME": "Grooming",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Design and simulate hair, fur, and feathers on CG characters—crafting their styles and then using physics simulations so that these features move realistically."
  },
  {
    "SERVICE_ID": "c868a841-bac3-4da1-9ed7-e5e4b075ea32",
    "SERVICE_NAME": "Keyframe Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "c868a841-bac3-4da1-9ed7-e5e4b075ea32",
    "SERVICE_L2_NAME": "Keyframe Animation",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Manually animate objects or characters by setting key poses at specific frames (the animator defines important positions, and software fills in between) to craft motion."
  },
  {
    "SERVICE_ID": "6d78c0d5-54ef-4a6b-a696-13ffe390fc6a",
    "SERVICE_NAME": "Rigging",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "6d78c0d5-54ef-4a6b-a696-13ffe390fc6a",
    "SERVICE_L2_NAME": "Rigging",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create a series of interconnected digital bones to drive surfaces via weighted values."
  },
  {
    "SERVICE_ID": "ae9a6a73-4a89-4063-bfc9-75eaf9fe6ceb",
    "SERVICE_NAME": "Skinning",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "ae9a6a73-4a89-4063-bfc9-75eaf9fe6ceb",
    "SERVICE_L2_NAME": "Skinning",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Bind a 3D character’s mesh (skin) to its rig (skeleton), ensuring that the character’s surface deforms believably (muscles and skin moving naturally with the bones)."
  },
  {
    "SERVICE_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_NAME": "Animation",
    "SERVICE_L1_ID": "db9c86dd-6add-440d-945b-bdbfdd7deece",
    "SERVICE_L1_NAME": "Animation",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create believable movement of characters and props using rigs."
  },
  {
    "SERVICE_ID": "400021d2-8733-480c-a880-1d851af7c59c",
    "SERVICE_NAME": "CAD Conversion",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "400021d2-8733-480c-a880-1d851af7c59c",
    "SERVICE_L2_NAME": "CAD Conversion",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Convert detailed CAD (computer-aided design) files into 3D models or formats suitable for animation and VFX, optimizing complex engineering data for creative use."
  },
  {
    "SERVICE_ID": "fa499629-5b06-40ab-b1ca-309c9591fe43",
    "SERVICE_NAME": "Character Design",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "fa499629-5b06-40ab-b1ca-309c9591fe43",
    "SERVICE_L2_NAME": "Character Design",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Conceive and develop the visual look of characters (their appearance, attire, and overall style) to fit the story’s world and make them instantly recognizable and compelling."
  },
  {
    "SERVICE_ID": "5d1f09ab-05a0-4747-a03c-6de904657631",
    "SERVICE_NAME": "Look Development",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "5d1f09ab-05a0-4747-a03c-6de904657631",
    "SERVICE_L2_NAME": "Look Development",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Define and refine the appearance of digital assets by creating the right colors, textures, and materials—ensuring every 3D character or environment looks just right in final renders."
  },
  {
    "SERVICE_ID": "83d0108c-3391-49b2-81c2-d42af330c99b",
    "SERVICE_NAME": "Modeling",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "83d0108c-3391-49b2-81c2-d42af330c99b",
    "SERVICE_L2_NAME": "Modeling",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create mesh objects that match the concept art and visual style of the film based on the shot breakdown task list."
  },
  {
    "SERVICE_ID": "2187d9f1-5509-4437-b9a8-b5bd27836a9d",
    "SERVICE_NAME": "Reality Capture",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "2187d9f1-5509-4437-b9a8-b5bd27836a9d",
    "SERVICE_L2_NAME": "Reality Capture",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Digitally scan real-world objects or environments (using 3D laser scanning, photogrammetry, etc.) to create accurate 3D models of them for use in the production."
  },
  {
    "SERVICE_ID": "77316ceb-6685-4353-a4ed-56aa0f09b58a",
    "SERVICE_NAME": "Technical Modeling",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "77316ceb-6685-4353-a4ed-56aa0f09b58a",
    "SERVICE_L2_NAME": "Technical Modeling",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Build precise, highly detailed 3D models of complex objects (machines, architecture, etc.) based on technical specifications, so they are accurate and ready for animation."
  },
  {
    "SERVICE_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_NAME": "Asset Creation",
    "SERVICE_L1_ID": "82a4edc7-b335-4ca6-9f99-8909c3df2512",
    "SERVICE_L1_NAME": "Asset Creation",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create mesh objects that match the concept art and visual style of the film based on the shot breakdown task list."
  },
  {
    "SERVICE_ID": "f4b6fe45-040f-4ffa-aef6-cf7114071baf",
    "SERVICE_NAME": "Crowd Multiplication",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "f4b6fe45-040f-4ffa-aef6-cf7114071baf",
    "SERVICE_L2_NAME": "Crowd Multiplication",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Use VFX techniques to replicate and composite groups of people, filling out scenes (stadiums, streets, etc.) with a digitally enlarged crowd for a realistic busy look."
  },
  {
    "SERVICE_ID": "08d234aa-6034-4d84-b139-e30d344d23df",
    "SERVICE_NAME": "Digital Cosmetics",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "08d234aa-6034-4d84-b139-e30d344d23df",
    "SERVICE_L2_NAME": "Digital Cosmetics",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Retouch and enhance footage by digitally removing blemishes, smoothing skin, de-aging actors or otherwise improving on-camera appearances for a polished final look."
  },
  {
    "SERVICE_ID": "6fd4204b-b8d9-4c1c-a554-3bb78035e1ce",
    "SERVICE_NAME": "Face Replacement",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "6fd4204b-b8d9-4c1c-a554-3bb78035e1ce",
    "SERVICE_L2_NAME": "Face Replacement",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Use CGI to replace an actor’s face with another face in footage—commonly done to make a stunt double or body double look like the principal actor on screen."
  },
  {
    "SERVICE_ID": "5af90f8f-b19b-49e8-b0b8-9fd352c206be",
    "SERVICE_NAME": "Matchmove",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "5af90f8f-b19b-49e8-b0b8-9fd352c206be",
    "SERVICE_L2_NAME": "Matchmove",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Track and recreate the exact movement of the real camera (or objects) in 3D space, allowing CGI elements to be placed into live-action footage with perfect alignment."
  },
  {
    "SERVICE_ID": "051f3497-4790-4cfe-a3d4-1bec7809bb0c",
    "SERVICE_NAME": "Matte Painting",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "051f3497-4790-4cfe-a3d4-1bec7809bb0c",
    "SERVICE_L2_NAME": "Matte Painting",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create highly detailed digital backdrops or set extensions by painting or compositing images, then seamlessly integrate them into scenes to represent locations too costly or impossible to film"
  },
  {
    "SERVICE_ID": "ab176226-9eaa-45a5-b00d-fa5653dfe6f0",
    "SERVICE_NAME": "Keying",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "042840ff-292a-46cb-9ecd-cb6109b56591",
    "SERVICE_L2_NAME": "RPM",
    "SERVICE_L3_ID": "ab176226-9eaa-45a5-b00d-fa5653dfe6f0",
    "SERVICE_L3_NAME": "Keying",
    "DESCRIPTION": "Composite two images together by removing specific colors (i.e. green) and refining the edges of the matte to improve the composite."
  },
  {
    "SERVICE_ID": "2dfe7a11-5a22-4c4c-af80-58ef996ab0ba",
    "SERVICE_NAME": "Paint",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "042840ff-292a-46cb-9ecd-cb6109b56591",
    "SERVICE_L2_NAME": "RPM",
    "SERVICE_L3_ID": "2dfe7a11-5a22-4c4c-af80-58ef996ab0ba",
    "SERVICE_L3_NAME": "Paint",
    "DESCRIPTION": "Frame-by-frame digitally remove or fix unwanted visual elements (wires, rigs, blemishes, etc.) from footage, painting over them to produce a clean, seamless final image."
  },
  {
    "SERVICE_ID": "0b35e731-6cac-4cc4-916f-1e8a0f87b66d",
    "SERVICE_NAME": "Rotoscoping",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "042840ff-292a-46cb-9ecd-cb6109b56591",
    "SERVICE_L2_NAME": "RPM",
    "SERVICE_L3_ID": "0b35e731-6cac-4cc4-916f-1e8a0f87b66d",
    "SERVICE_L3_NAME": "Rotoscoping",
    "DESCRIPTION": "Create animated mattes to remove actors, rigging or objects from a shot or vfx sequence."
  },
  {
    "SERVICE_ID": "042840ff-292a-46cb-9ecd-cb6109b56591",
    "SERVICE_NAME": "RPM",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "042840ff-292a-46cb-9ecd-cb6109b56591",
    "SERVICE_L2_NAME": "RPM",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Roto/Paint/Matchmove – Perform a combination of rotoscoping (tracing elements to isolate them), digital paint clean-ups, and matchmoving (tracking), preparing VFX shots for seamless compositing."
  },
  {
    "SERVICE_ID": "eb83d7c7-e34d-4bbe-8c3c-e0b15832239e",
    "SERVICE_NAME": "Split Screen",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "eb83d7c7-e34d-4bbe-8c3c-e0b15832239e",
    "SERVICE_L2_NAME": "Split Screen",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Composite multiple camera takes or images into one frame (often dividing the screen), allowing two or more scenes or performances to appear side by side or in one seamless shot."
  },
  {
    "SERVICE_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_NAME": "Compositing",
    "SERVICE_L1_ID": "04877c54-58cc-4a04-9583-1b7b066ae2d1",
    "SERVICE_L1_NAME": "Compositing",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Layer the various plates and use various blending techniques to create a believable composite image."
  },
  {
    "SERVICE_ID": "3afe1cd6-60cf-4982-b2c0-b4eee83440d3",
    "SERVICE_NAME": "Concept Development",
    "SERVICE_L1_ID": "3afe1cd6-60cf-4982-b2c0-b4eee83440d3",
    "SERVICE_L1_NAME": "Concept Development",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Develop the core creative concept or premise of a project—brainstorming and refining the story idea, themes, and style at an early stage to set a strong foundation for the production."
  },
  {
    "SERVICE_ID": "1a6ca4c4-c1da-435c-a2d4-45d33cf6c312",
    "SERVICE_NAME": "Creative Supervision",
    "SERVICE_L1_ID": "1a6ca4c4-c1da-435c-a2d4-45d33cf6c312",
    "SERVICE_L1_NAME": "Creative Supervision",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Explore inspirations, references, and background information to inform the creative process—researching styles, history, or technology to ground and enhance the project’s creative direction."
  },
  {
    "SERVICE_ID": "7def15bb-c4f5-49c0-8907-80ea755aa18c",
    "SERVICE_NAME": "Editorial",
    "SERVICE_L1_ID": "7def15bb-c4f5-49c0-8907-80ea755aa18c",
    "SERVICE_L1_NAME": "Editorial",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Assembling shots into a coherent sequence according to the script and director's guidance."
  },
  {
    "SERVICE_ID": "0f58bc41-ddf7-41a7-bba9-7f840465ea7c",
    "SERVICE_NAME": "Extended Reality",
    "SERVICE_L1_ID": "0f58bc41-ddf7-41a7-bba9-7f840465ea7c",
    "SERVICE_L1_NAME": "Extended Reality",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Encompass all immersive technologies (XR) like virtual reality (VR), augmented reality (AR), and mixed reality (MR) that blend digital elements with the real world for interactive experiences"
  },
  {
    "SERVICE_ID": "c5438e50-d429-4263-8f8e-676b5414fff0",
    "SERVICE_NAME": "2D Game Development",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "c5438e50-d429-4263-8f8e-676b5414fff0",
    "SERVICE_L2_NAME": "2D Game Development",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Develop video games with two-dimensional graphics and gameplay, utilizing flat art and side-scrolling or top-down perspectives to create engaging interactive experiences"
  },
  {
    "SERVICE_ID": "e07cf549-1a1e-467e-a0b2-3693d9f7e8d5",
    "SERVICE_NAME": "3D Game Development",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "e07cf549-1a1e-467e-a0b2-3693d9f7e8d5",
    "SERVICE_L2_NAME": "3D Game Development",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create video games using three-dimensional models and environments, building immersive worlds with depth where players can move and interact in 3D space"
  },
  {
    "SERVICE_ID": "d869dd1d-3e61-40c1-8842-d35ade7118b5",
    "SERVICE_NAME": "Cinematics",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "d869dd1d-3e61-40c1-8842-d35ade7118b5",
    "SERVICE_L2_NAME": "Cinematics",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Cinematics performs specialized functions within the media creation process."
  },
  {
    "SERVICE_ID": "0fe2329f-b037-4683-9329-6fb15c3771a9",
    "SERVICE_NAME": "Game Coding",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "0fe2329f-b037-4683-9329-6fb15c3771a9",
    "SERVICE_L2_NAME": "Game Coding",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Program the software logic of a game—writing code that implements gameplay mechanics, controls, AI behaviors, and engine features to turn the game’s design into a playable product."
  },
  {
    "SERVICE_ID": "1bc17580-3bce-4c40-8c3b-e38cfc8bf3de",
    "SERVICE_NAME": "Game Design",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "1bc17580-3bce-4c40-8c3b-e38cfc8bf3de",
    "SERVICE_L2_NAME": "Game Design",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Craft the rules, mechanics, objectives, and overall player experience of a game, defining how it plays and what makes it fun or challenging."
  },
  {
    "SERVICE_ID": "dc330228-3f71-4f40-87d2-cdd7b2880428",
    "SERVICE_NAME": "Level Design",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "dc330228-3f71-4f40-87d2-cdd7b2880428",
    "SERVICE_L2_NAME": "Level Design",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Plan and construct the playable levels or environments of a game, defining layouts, obstacles, and objectives in each stage to ensure a balanced and engaging player experience."
  },
  {
    "SERVICE_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_NAME": "Game Development",
    "SERVICE_L1_ID": "12e0d531-8372-40f2-9cc8-b2b512296210",
    "SERVICE_L1_NAME": "Game Development",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Manage the end-to-end process of creating a video game from concept to completion—combining design, art, coding, and testing to build a playable, polished final product."
  },
  {
    "SERVICE_ID": "95738914-96c9-40b0-b19f-0abdefc19bba",
    "SERVICE_NAME": "Generative AI",
    "SERVICE_L1_ID": "95738914-96c9-40b0-b19f-0abdefc19bba",
    "SERVICE_L1_NAME": "Generative AI",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Leverage artificial intelligence models to automatically generate creative content (text, images, audio, etc.), or assist in content creation, bringing speed and novel ideas to the production."
  },
  {
    "SERVICE_ID": "01cfcff9-b30b-4e70-b26c-d54fdf4735b1",
    "SERVICE_NAME": "Graphic Design",
    "SERVICE_L1_ID": "01cfcff9-b30b-4e70-b26c-d54fdf4735b1",
    "SERVICE_L1_NAME": "Graphic Design",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Design visual assets that communicate information or enhance storytelling by creating graphics such as logos, layouts, posters, titles, and digital artwork for use in print, video, or digital media."
  },
  {
    "SERVICE_ID": "299e0be6-d18d-4dd2-afa8-70199b7efa4b",
    "SERVICE_NAME": "Service Oriented Architecture",
    "SERVICE_L1_ID": "d2077823-86c9-4a73-b408-cc887318185f",
    "SERVICE_L1_NAME": "Managed Services",
    "SERVICE_L2_ID": "0d2c081e-8b0a-4ab5-8fc7-a3a9a091b703",
    "SERVICE_L2_NAME": "System Integration",
    "SERVICE_L3_ID": "299e0be6-d18d-4dd2-afa8-70199b7efa4b",
    "SERVICE_L3_NAME": "Service Oriented Architecture",
    "DESCRIPTION": "Design software systems as a suite of interoperable services (instead of one big application), so that each service can communicate over a network and be reused, making the overall system more modular and flexible."
  },
  {
    "SERVICE_ID": "d5e1c963-7564-455d-b3b4-84173b407d0c",
    "SERVICE_NAME": "Workflow Consultation",
    "SERVICE_L1_ID": "d2077823-86c9-4a73-b408-cc887318185f",
    "SERVICE_L1_NAME": "Managed Services",
    "SERVICE_L2_ID": "0d2c081e-8b0a-4ab5-8fc7-a3a9a091b703",
    "SERVICE_L2_NAME": "System Integration",
    "SERVICE_L3_ID": "d5e1c963-7564-455d-b3b4-84173b407d0c",
    "SERVICE_L3_NAME": "Workflow Consultation",
    "DESCRIPTION": "Evaluate a team’s production or business workflows and provide expert advice on improving efficiency—recommending process optimizations, tool integrations, or best practices to streamline the overall operation."
  },
  {
    "SERVICE_ID": "0d2c081e-8b0a-4ab5-8fc7-a3a9a091b703",
    "SERVICE_NAME": "System Integration",
    "SERVICE_L1_ID": "d2077823-86c9-4a73-b408-cc887318185f",
    "SERVICE_L1_NAME": "Managed Services",
    "SERVICE_L2_ID": "0d2c081e-8b0a-4ab5-8fc7-a3a9a091b703",
    "SERVICE_L2_NAME": "System Integration",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Connect and coordinate different software or hardware systems into one cohesive setup, ensuring all components communicate properly so that data and processes flow smoothly between them."
  },
  {
    "SERVICE_ID": "d2077823-86c9-4a73-b408-cc887318185f",
    "SERVICE_NAME": "Managed Services",
    "SERVICE_L1_ID": "d2077823-86c9-4a73-b408-cc887318185f",
    "SERVICE_L1_NAME": "Managed Services",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Provide ongoing outsourced management and support for certain business or IT functions, where a specialized provider handles day-to-day operations and maintenance of those services"
  },
  {
    "SERVICE_ID": "4e06046b-22ad-4bbf-ba97-9d04f544dcc6",
    "SERVICE_NAME": "Motion Graphics",
    "SERVICE_L1_ID": "4e06046b-22ad-4bbf-ba97-9d04f544dcc6",
    "SERVICE_L1_NAME": "Motion Graphics",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Design and animate graphic elements (titles, logos, lower-thirds, etc.) to convey information or enhance visuals in video content, making static graphics come alive in an engaging way"
  },
  {
    "SERVICE_ID": "1f857e37-a785-4e05-9b3f-95109eed9a38",
    "SERVICE_NAME": "Archiving",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "1f857e37-a785-4e05-9b3f-95109eed9a38",
    "SERVICE_L3_NAME": "Archiving",
    "DESCRIPTION": "Create the various packages for distribution and archiving."
  },
  {
    "SERVICE_ID": "4d19ef91-d55c-4eac-baed-9973cc0de123",
    "SERVICE_NAME": "Color Grading",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "4d19ef91-d55c-4eac-baed-9973cc0de123",
    "SERVICE_L3_NAME": "Color Grading",
    "DESCRIPTION": "Color match the film and add color changes to create a particular mood or style."
  },
  {
    "SERVICE_ID": "01ae0aec-31a0-4d98-bb4c-00c2d1eb0738",
    "SERVICE_NAME": "Digital Asset Management",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "01ae0aec-31a0-4d98-bb4c-00c2d1eb0738",
    "SERVICE_L3_NAME": "Digital Asset Management",
    "DESCRIPTION": "Securely store, organize, and retrieve digital content (videos, images, audio, documents, etc.) in a centralized library with controlled acces"
  },
  {
    "SERVICE_ID": "e786acc1-5985-48bb-9974-55db74dc1f4c",
    "SERVICE_NAME": "Digital Cinema Packaging",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "e786acc1-5985-48bb-9974-55db74dc1f4c",
    "SERVICE_L3_NAME": "Digital Cinema Packaging",
    "DESCRIPTION": "Create the theatrical rendered images and audio sequence into a digital master."
  },
  {
    "SERVICE_ID": "01140c62-060e-402b-b66c-051029b66b66",
    "SERVICE_NAME": "Encoding",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "01140c62-060e-402b-b66c-051029b66b66",
    "SERVICE_L3_NAME": "Encoding",
    "DESCRIPTION": "Compress raw video or audio into a specific digital format or codec for efficient distribution, reducing file size while maintaining qualit"
  },
  {
    "SERVICE_ID": "c922f713-eebe-4371-bf45-f7651be84648",
    "SERVICE_NAME": "Localization",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "c922f713-eebe-4371-bf45-f7651be84648",
    "SERVICE_L3_NAME": "Localization",
    "DESCRIPTION": "Adapt and translate content for different languages and regions, including dubbing or subtitles and cultural tweaks, so it resonates with local audiences"
  },
  {
    "SERVICE_ID": "0589a8dd-689f-4c6d-be73-8d7e6d750509",
    "SERVICE_NAME": "Mastering",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "0589a8dd-689f-4c6d-be73-8d7e6d750509",
    "SERVICE_L3_NAME": "Mastering",
    "DESCRIPTION": "Create the various packages for distribution and archiving."
  },
  {
    "SERVICE_ID": "d18ecbe2-9719-46a9-ba0e-95abc93e546f",
    "SERVICE_NAME": "Quality Control",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "d18ecbe2-9719-46a9-ba0e-95abc93e546f",
    "SERVICE_L3_NAME": "Quality Control",
    "DESCRIPTION": "Reviewing audio, video, and images to ensure they meet basic distribution standards"
  },
  {
    "SERVICE_ID": "612ba1d9-9136-4268-9736-60d170ba3429",
    "SERVICE_NAME": "Transcoding",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "612ba1d9-9136-4268-9736-60d170ba3429",
    "SERVICE_L3_NAME": "Transcoding",
    "DESCRIPTION": "Convert already-encoded video or audio files from one format or bitrate to another to meet specific playback requirements (for example, creating various file sizes for streaming)."
  },
  {
    "SERVICE_ID": "75b4865d-6e93-45af-9cd7-bbc88472f03c",
    "SERVICE_NAME": "Transcription",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "75b4865d-6e93-45af-9cd7-bbc88472f03c",
    "SERVICE_L3_NAME": "Transcription",
    "DESCRIPTION": "Convert spoken audio (dialogue, interviews, etc.) into written text—listening to video or audio and producing an accurate text transcript, often for subtitles, captions, or documentation."
  },
  {
    "SERVICE_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_NAME": "Post-Production Services",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "29c00410-16f0-40e4-b34f-4d051887fa7d",
    "SERVICE_L2_NAME": "Post-Production Services",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Pre-production represents all of the necessary activities to edit, mix final sound, add vfx and titles, finish and create digital masters for distribution."
  },
  {
    "SERVICE_ID": "1e51bdd3-0c42-4271-ba0b-0c0f5edc5252",
    "SERVICE_NAME": "Casting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "1e51bdd3-0c42-4271-ba0b-0c0f5edc5252",
    "SERVICE_L3_NAME": "Casting",
    "DESCRIPTION": "Casting selects and secures personnel or talent for production."
  },
  {
    "SERVICE_ID": "43245252-fa5b-496b-8f91-4763dc80a648",
    "SERVICE_NAME": "Costume Design",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "43245252-fa5b-496b-8f91-4763dc80a648",
    "SERVICE_L3_NAME": "Costume Design",
    "DESCRIPTION": "Prepare the proposed cost and schedules for the wardobe for the production."
  },
  {
    "SERVICE_ID": "0ee9e1da-abb5-4e44-98e8-e0314ea2256b",
    "SERVICE_NAME": "Crew Hiring",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "0ee9e1da-abb5-4e44-98e8-e0314ea2256b",
    "SERVICE_L3_NAME": "Crew Hiring",
    "DESCRIPTION": "Write up and sign contracts for the entire production crew."
  },
  {
    "SERVICE_ID": "ccd216bb-1192-4ccd-aa66-0540c68c0a2e",
    "SERVICE_NAME": "Equipment Acquisition",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "ccd216bb-1192-4ccd-aa66-0540c68c0a2e",
    "SERVICE_L3_NAME": "Equipment Acquisition",
    "DESCRIPTION": "Source and procure all of the required equipment approved in the breakdown and budget."
  },
  {
    "SERVICE_ID": "bf93e5d4-58f1-4431-9c24-b9be9496ff2e",
    "SERVICE_NAME": "Finance Development",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "bf93e5d4-58f1-4431-9c24-b9be9496ff2e",
    "SERVICE_L3_NAME": "Finance Development",
    "DESCRIPTION": "Procure the initial money to fund the development activities."
  },
  {
    "SERVICE_ID": "73c38520-feba-4db7-9196-f3ac71325a3d",
    "SERVICE_NAME": "Hire Leadership",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "73c38520-feba-4db7-9196-f3ac71325a3d",
    "SERVICE_L3_NAME": "Hire Leadership",
    "DESCRIPTION": "Write up and sign contracts for above the line talent."
  },
  {
    "SERVICE_ID": "b65eb23e-c24a-45dc-8b16-5cc34ebf876a",
    "SERVICE_NAME": "Licensing",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "b65eb23e-c24a-45dc-8b16-5cc34ebf876a",
    "SERVICE_L3_NAME": "Licensing",
    "DESCRIPTION": "Ensure all referenced material and characters are licensed for the production or series."
  },
  {
    "SERVICE_ID": "bff38222-5d81-4c40-abb7-027b3f24b5dd",
    "SERVICE_NAME": "Location-Scouting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "bff38222-5d81-4c40-abb7-027b3f24b5dd",
    "SERVICE_L3_NAME": "Location-Scouting",
    "DESCRIPTION": "Scout locations for principal photography."
  },
  {
    "SERVICE_ID": "e1dba8dc-3c82-4b13-b01c-1f35ce897660",
    "SERVICE_NAME": "Previsualization",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "e1dba8dc-3c82-4b13-b01c-1f35ce897660",
    "SERVICE_L3_NAME": "Previsualization",
    "DESCRIPTION": "Visually map out the scenes in a production before principal photography."
  },
  {
    "SERVICE_ID": "bbd6e01b-24fb-40aa-bb14-2739ecf71de5",
    "SERVICE_NAME": "Production Budgeting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "bbd6e01b-24fb-40aa-bb14-2739ecf71de5",
    "SERVICE_L3_NAME": "Production Budgeting",
    "DESCRIPTION": "Prepare the overall budget for the production."
  },
  {
    "SERVICE_ID": "bc70861a-07d9-4aae-a790-536f5f85e410",
    "SERVICE_NAME": "Production Design",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "bc70861a-07d9-4aae-a790-536f5f85e410",
    "SERVICE_L3_NAME": "Production Design",
    "DESCRIPTION": "Prepare the look, color, and tone of the picture of the production."
  },
  {
    "SERVICE_ID": "88243e5a-8733-47c5-bfb7-3e9aaf8361e9",
    "SERVICE_NAME": "Production Logistics",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "88243e5a-8733-47c5-bfb7-3e9aaf8361e9",
    "SERVICE_L3_NAME": "Production Logistics",
    "DESCRIPTION": "Prepare all of the various schedules, check-lists, and plans for principal photography."
  },
  {
    "SERVICE_ID": "0d7c385d-87de-4c8d-85f0-ff04809c8ffd",
    "SERVICE_NAME": "Production Scheduling",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "0d7c385d-87de-4c8d-85f0-ff04809c8ffd",
    "SERVICE_L3_NAME": "Production Scheduling",
    "DESCRIPTION": "Use the breakdown and crew and location availability to create a master shoot schedule."
  },
  {
    "SERVICE_ID": "29b3c237-397e-4cc8-b355-6e64eff5f306",
    "SERVICE_NAME": "Production Scouting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "29b3c237-397e-4cc8-b355-6e64eff5f306",
    "SERVICE_L3_NAME": "Production Scouting",
    "DESCRIPTION": "Scout locations for principal photography."
  },
  {
    "SERVICE_ID": "2d523f0b-5c0b-49a2-afe2-21632916973f",
    "SERVICE_NAME": "Resource Planning",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "2d523f0b-5c0b-49a2-afe2-21632916973f",
    "SERVICE_L3_NAME": "Resource Planning",
    "DESCRIPTION": "Prepare all of the various schedules, check-lists, and plans for principal photography."
  },
  {
    "SERVICE_ID": "e10daa51-6b5d-49e6-9a34-aaa6ed8c5f4b",
    "SERVICE_NAME": "Scripting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "e10daa51-6b5d-49e6-9a34-aaa6ed8c5f4b",
    "SERVICE_L3_NAME": "Scripting",
    "DESCRIPTION": "Write Script represents all of the necessary activities to develop, iterate and finalize a script for pre-production."
  },
  {
    "SERVICE_ID": "06b5ca62-35de-4ecb-898a-5659985128bb",
    "SERVICE_NAME": "Set Design",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "06b5ca62-35de-4ecb-898a-5659985128bb",
    "SERVICE_L3_NAME": "Set Design",
    "DESCRIPTION": "Design set approved in the breakdown and budget."
  },
  {
    "SERVICE_ID": "f2980735-9783-4d28-84f3-c57c50b5a7e0",
    "SERVICE_NAME": "Shoot Scheduling",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "f2980735-9783-4d28-84f3-c57c50b5a7e0",
    "SERVICE_L3_NAME": "Shoot Scheduling",
    "DESCRIPTION": "Use the breakdown and crew and location availability to create a master shoot schedule."
  },
  {
    "SERVICE_ID": "3bcc59ad-d3a4-4777-939b-f70c49a4f8f1",
    "SERVICE_NAME": "Shot List Creation",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "3bcc59ad-d3a4-4777-939b-f70c49a4f8f1",
    "SERVICE_L3_NAME": "Shot List Creation",
    "DESCRIPTION": "Create a list of shots in scheduled shooting order with angles and setups defined."
  },
  {
    "SERVICE_ID": "66d99ecd-ebf6-4c7f-84df-0f48270cfce4",
    "SERVICE_NAME": "Stunt Coordination",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "66d99ecd-ebf6-4c7f-84df-0f48270cfce4",
    "SERVICE_L3_NAME": "Stunt Coordination",
    "DESCRIPTION": "Plan, rehearse and secure all necessary equipment for all stunts approved in the budget and breakdown."
  },
  {
    "SERVICE_ID": "3136e361-8c1f-40a6-9ce2-6faf5d340a3a",
    "SERVICE_NAME": "VFX & SFX Budgeting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "3136e361-8c1f-40a6-9ce2-6faf5d340a3a",
    "SERVICE_L3_NAME": "VFX & SFX Budgeting",
    "DESCRIPTION": "Prepare and segment all of the logistics information required per department and vendor."
  },
  {
    "SERVICE_ID": "3672a386-b80b-44ec-8a84-163bb005160e",
    "SERVICE_NAME": "Visual Style Design",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "3672a386-b80b-44ec-8a84-163bb005160e",
    "SERVICE_L3_NAME": "Visual Style Design",
    "DESCRIPTION": "Prepare the look, color, and tone of the picture of the production."
  },
  {
    "SERVICE_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_NAME": "Pre-Production Services",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Pre-production represents all of the necessary activities to take an approved script to production and shoot."
  },
  {
    "SERVICE_ID": "c2088657-361d-41aa-b7e8-4e4e261042f3",
    "SERVICE_NAME": "Script Breakdown",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "3ffbd4b3-e849-490f-8f13-8281ca1dd560",
    "SERVICE_L2_NAME": "Pre-Production Services",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Break down the script to identify locations, characters, stunts, and fx to be prepped and budgeted."
  },
  {
    "SERVICE_ID": "62a41782-2155-451a-8c3e-a254de6f1e8d",
    "SERVICE_NAME": "Acting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "62a41782-2155-451a-8c3e-a254de6f1e8d",
    "SERVICE_L3_NAME": "Acting",
    "DESCRIPTION": "Actors perform actions and dialog."
  },
  {
    "SERVICE_ID": "b759defc-f9ac-480b-b36f-d5ff2c030adb",
    "SERVICE_NAME": "Aerial Photography",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "b759defc-f9ac-480b-b36f-d5ff2c030adb",
    "SERVICE_L3_NAME": "Aerial Photography",
    "DESCRIPTION": "Source, prepare, and install cameras on UAVs or aeroplanes to capture principal photography."
  },
  {
    "SERVICE_ID": "e48e8cc5-eba6-46c5-a378-216bf3217510",
    "SERVICE_NAME": "Audio Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "e48e8cc5-eba6-46c5-a378-216bf3217510",
    "SERVICE_L3_NAME": "Audio Setup",
    "DESCRIPTION": "Source, prepare, and install audio recording equipment for principal photography."
  },
  {
    "SERVICE_ID": "a56833d4-6fe6-46f7-a84c-b09495eef52a",
    "SERVICE_NAME": "Camera Lens Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "a56833d4-6fe6-46f7-a84c-b09495eef52a",
    "SERVICE_L3_NAME": "Camera Lens Setup",
    "DESCRIPTION": "Source, prepare and install cameras and storage for principal photography."
  },
  {
    "SERVICE_ID": "a8cc189f-5ae1-4db3-a14d-77ab54d70bf8",
    "SERVICE_NAME": "Camera Operations",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "a8cc189f-5ae1-4db3-a14d-77ab54d70bf8",
    "SERVICE_L3_NAME": "Camera Operations",
    "DESCRIPTION": "Recording devices capture rotational and positional movements of cameras and lens for virtual production and post production."
  },
  {
    "SERVICE_ID": "b41d5d42-cc36-43aa-bd0d-0815c7782a58",
    "SERVICE_NAME": "Camera Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "b41d5d42-cc36-43aa-bd0d-0815c7782a58",
    "SERVICE_L3_NAME": "Camera Setup",
    "DESCRIPTION": "Source, prepare and install cameras and storage for principal photography."
  },
  {
    "SERVICE_ID": "e116d3bc-0018-4e11-9fff-988a4d259c74",
    "SERVICE_NAME": "Capture",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "e116d3bc-0018-4e11-9fff-988a4d259c74",
    "SERVICE_L3_NAME": "Capture",
    "DESCRIPTION": "All of the actions and recording of data broken down into shots and takes."
  },
  {
    "SERVICE_ID": "a46c8183-9b2b-412a-b8e5-efcc09cba42c",
    "SERVICE_NAME": "Continuity & Notes",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "a46c8183-9b2b-412a-b8e5-efcc09cba42c",
    "SERVICE_L3_NAME": "Continuity & Notes",
    "DESCRIPTION": "Script Supervisor works between takes and shoot days to ensure continuity of the production in relation to the script."
  },
  {
    "SERVICE_ID": "69b5efe6-7b25-4c53-8d63-511f9c501656",
    "SERVICE_NAME": "Costume Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "69b5efe6-7b25-4c53-8d63-511f9c501656",
    "SERVICE_L3_NAME": "Costume Setup",
    "DESCRIPTION": "Source and prepare costumes and dress actors on the shoot day."
  },
  {
    "SERVICE_ID": "a8cdf801-164f-465d-a560-80dd42ecc7eb",
    "SERVICE_NAME": "Dailies",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "a8cdf801-164f-465d-a560-80dd42ecc7eb",
    "SERVICE_L3_NAME": "Dailies",
    "DESCRIPTION": "Create encompasses all of the activities to create reviewable video and audio of a given day's shoot by the key members of a production."
  },
  {
    "SERVICE_ID": "c672087c-3c66-4467-8667-bf9166339d26",
    "SERVICE_NAME": "Directing",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "c672087c-3c66-4467-8667-bf9166339d26",
    "SERVICE_L3_NAME": "Directing",
    "DESCRIPTION": "Lead the filmmaking process by guiding the creative vision on set—directing actors’ performances and making decisions on camera work, lighting, and pacing to tell the story effectively"
  },
  {
    "SERVICE_ID": "dce6f422-4e5b-4e06-855b-76c6b775372e",
    "SERVICE_NAME": "Equipment Rental",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "dce6f422-4e5b-4e06-855b-76c6b775372e",
    "SERVICE_L3_NAME": "Equipment Rental",
    "DESCRIPTION": "Source and procure all of the required equipment approved in the breakdown and budget."
  },
  {
    "SERVICE_ID": "8b10ed5b-cd6e-4d98-a185-2a9443de4d58",
    "SERVICE_NAME": "Foley ADR",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "8b10ed5b-cd6e-4d98-a185-2a9443de4d58",
    "SERVICE_L3_NAME": "Foley ADR",
    "DESCRIPTION": "Reproduction and recording of common sounds to accompany movement, VFX, and environment in a film production."
  },
  {
    "SERVICE_ID": "839cdcf7-e171-4a94-b1f2-f8bd35f00136",
    "SERVICE_NAME": "Hair & Makeup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "839cdcf7-e171-4a94-b1f2-f8bd35f00136",
    "SERVICE_L3_NAME": "Hair & Makeup",
    "DESCRIPTION": "Source and prepare hair and makeup and prepare actors on the shoot day."
  },
  {
    "SERVICE_ID": "52a4b05c-215d-4f99-b18c-75636a60ad8e",
    "SERVICE_NAME": "LED Volume",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "52a4b05c-215d-4f99-b18c-75636a60ad8e",
    "SERVICE_L3_NAME": "LED Volume",
    "DESCRIPTION": "Source, preparing, and setting up an LED volume for virtual production."
  },
  {
    "SERVICE_ID": "6a9140a3-ebf7-4ebb-b527-09bb4e0c23b2",
    "SERVICE_NAME": "Lighting Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "6a9140a3-ebf7-4ebb-b527-09bb4e0c23b2",
    "SERVICE_L3_NAME": "Lighting Setup",
    "DESCRIPTION": "Source, prepare, install and adjust ligthing to match visual style approved in breakdown."
  },
  {
    "SERVICE_ID": "17c5855b-545e-45b2-8fcd-4525bd243064",
    "SERVICE_NAME": "Live Capture",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "17c5855b-545e-45b2-8fcd-4525bd243064",
    "SERVICE_L3_NAME": "Live Capture",
    "DESCRIPTION": "All of the actions and recording of data broken down into shots and takes."
  },
  {
    "SERVICE_ID": "b204182f-a5b3-41fa-b6c5-e4a3c97f4bd4",
    "SERVICE_NAME": "Monitoring Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "b204182f-a5b3-41fa-b6c5-e4a3c97f4bd4",
    "SERVICE_L3_NAME": "Monitoring Setup",
    "DESCRIPTION": "Setup video and audio playback devices onset for key creatives to oversee picture and sound on a given shoot day."
  },
  {
    "SERVICE_ID": "9da19109-8054-4d0c-a739-22e4c029bdf1",
    "SERVICE_NAME": "Motion Control Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "9da19109-8054-4d0c-a739-22e4c029bdf1",
    "SERVICE_L3_NAME": "Motion Control Setup",
    "DESCRIPTION": "Source, prepare, and install motion control units for principal photography to match movements in the breakdown."
  },
  {
    "SERVICE_ID": "5a284924-5624-4209-bb20-867ea8a3cb9c",
    "SERVICE_NAME": "On-Set Services",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "5a284924-5624-4209-bb20-867ea8a3cb9c",
    "SERVICE_L3_NAME": "On-Set Services",
    "DESCRIPTION": "All services related to prepping, building, and running a set on a given shoot day."
  },
  {
    "SERVICE_ID": "d5eee1a6-5a14-4e9f-b0e9-0538201c2c6d",
    "SERVICE_NAME": "Picture Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "d5eee1a6-5a14-4e9f-b0e9-0538201c2c6d",
    "SERVICE_L3_NAME": "Picture Setup",
    "DESCRIPTION": "Source, prepare and install cameras and storage for principal photography."
  },
  {
    "SERVICE_ID": "350018b6-3f4e-445d-8700-caf78cb0ab86",
    "SERVICE_NAME": "Real Time",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "350018b6-3f4e-445d-8700-caf78cb0ab86",
    "SERVICE_L3_NAME": "Real Time",
    "DESCRIPTION": "Ability to create assets, animations, and setups that can perform in a virtual production."
  },
  {
    "SERVICE_ID": "165d2af9-a4c0-4d0d-a4a3-37025af83182",
    "SERVICE_NAME": "Reference Capture",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "165d2af9-a4c0-4d0d-a4a3-37025af83182",
    "SERVICE_L3_NAME": "Reference Capture",
    "DESCRIPTION": "Capture digitally the state of a set for continuity and post production."
  },
  {
    "SERVICE_ID": "80e0abcc-2861-43b2-b97e-63a48455dad0",
    "SERVICE_NAME": "Rehearsals",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "80e0abcc-2861-43b2-b97e-63a48455dad0",
    "SERVICE_L3_NAME": "Rehearsals",
    "DESCRIPTION": "Run through the actions and dialogue of a given scene before principal photography."
  },
  {
    "SERVICE_ID": "c98f802b-a7c7-4d96-8b81-112fb4a614cb",
    "SERVICE_NAME": "Remote Production Direction",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "c98f802b-a7c7-4d96-8b81-112fb4a614cb",
    "SERVICE_L3_NAME": "Remote Production Direction",
    "DESCRIPTION": "Guiding or instructing performances from a remote location offset via the internet."
  },
  {
    "SERVICE_ID": "909e8b26-0cc8-4657-bd64-0b03a7f36c28",
    "SERVICE_NAME": "Rigging Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "909e8b26-0cc8-4657-bd64-0b03a7f36c28",
    "SERVICE_L3_NAME": "Rigging Setup",
    "DESCRIPTION": "Source, prepare, and install all elements to move and manipulative cameras and lights during a shoot."
  },
  {
    "SERVICE_ID": "f0027c62-af7d-48a7-a0fe-0aab83e83b40",
    "SERVICE_NAME": "Scene Shooting",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "f0027c62-af7d-48a7-a0fe-0aab83e83b40",
    "SERVICE_L3_NAME": "Scene Shooting",
    "DESCRIPTION": "All of the actions and recording of data broken down into shots and takes."
  },
  {
    "SERVICE_ID": "3bb767a5-40ce-4bc6-a5b1-46e50562ee29",
    "SERVICE_NAME": "Set Dressing",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "3bb767a5-40ce-4bc6-a5b1-46e50562ee29",
    "SERVICE_L3_NAME": "Set Dressing",
    "DESCRIPTION": "Place props, design elements, draperies, and marks to match a shot setup for the shoot day."
  },
  {
    "SERVICE_ID": "d48ccfa2-ccbe-4470-b936-463ce8191df5",
    "SERVICE_NAME": "Special Effects",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "d48ccfa2-ccbe-4470-b936-463ce8191df5",
    "SERVICE_L3_NAME": "Special Effects",
    "DESCRIPTION": "Create special effects in coordination with the actor and stunt performances."
  },
  {
    "SERVICE_ID": "8fdbaa4e-0e42-4d7f-8ad6-19fde07c25e3",
    "SERVICE_NAME": "Special Effects Setup",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "8fdbaa4e-0e42-4d7f-8ad6-19fde07c25e3",
    "SERVICE_L3_NAME": "Special Effects Setup",
    "DESCRIPTION": "Source, prepare, install and rehearse all of the special effects (fog, fire, explosions, water) approved in the budget and breakdown."
  },
  {
    "SERVICE_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_NAME": "Principal Photography",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "5db74599-892a-4811-9f0f-58c2710fbc59",
    "SERVICE_L2_NAME": "Principal Photography",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "All of the actions and recording of data broken down into shots and takes."
  },
  {
    "SERVICE_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_NAME": "Production Services",
    "SERVICE_L1_ID": "0a8068c7-b1f0-4849-bbb6-6b59ad5b662d",
    "SERVICE_L1_NAME": "Production Services",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "All of the services offered to produce a creative work"
  },
  {
    "SERVICE_ID": "50c17742-39cb-4ab0-8df8-5a39de292918",
    "SERVICE_NAME": "Sound Design",
    "SERVICE_L1_ID": "50c17742-39cb-4ab0-8df8-5a39de292918",
    "SERVICE_L1_NAME": "Sound Design",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create sound represents all of the necessary activities to create dialog and sounds to accompany movement, VFX, and environment in a creative work."
  },
  {
    "SERVICE_ID": "db1174b8-b4bf-4ee2-a0f3-83b89fb9b498",
    "SERVICE_NAME": "UI Design",
    "SERVICE_L1_ID": "db1174b8-b4bf-4ee2-a0f3-83b89fb9b498",
    "SERVICE_L1_NAME": "UI Design",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Design the user interface of an application or game, focusing on the visual layout and interactive elements (buttons, menus, icons) to ensure it is aesthetically pleasing and easy to use"
  },
  {
    "SERVICE_ID": "8974f7c8-4ba5-4d99-b53b-901dbecd74f8",
    "SERVICE_NAME": "Virtual Camera",
    "SERVICE_L1_ID": "fe46230e-0cd2-4617-84b1-55b214262286",
    "SERVICE_L1_NAME": "Virtual Production",
    "SERVICE_L2_ID": "8974f7c8-4ba5-4d99-b53b-901dbecd74f8",
    "SERVICE_L2_NAME": "Virtual Camera",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Operate a camera in a virtual 3D environment (often with a tablet or VR rig) to “film” CG scenes in real time, giving filmmakers a hands-on way to frame shots inside digital worlds."
  },
  {
    "SERVICE_ID": "7cd1c2a7-1d87-4cab-933c-0c197b8de7d1",
    "SERVICE_NAME": "Virtual Scouting",
    "SERVICE_L1_ID": "fe46230e-0cd2-4617-84b1-55b214262286",
    "SERVICE_L1_NAME": "Virtual Production",
    "SERVICE_L2_ID": "7cd1c2a7-1d87-4cab-933c-0c197b8de7d1",
    "SERVICE_L2_NAME": "Virtual Scouting",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Use VR or digital tools to scout locations and sets remotely—navigating virtual environments or 3D scans of real places to plan shots and set designs without needing a physical visit."
  },
  {
    "SERVICE_ID": "fe46230e-0cd2-4617-84b1-55b214262286",
    "SERVICE_NAME": "Virtual Production",
    "SERVICE_L1_ID": "fe46230e-0cd2-4617-84b1-55b214262286",
    "SERVICE_L1_NAME": "Virtual Production",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "A cutting-edge filmmaking method that combines real-time CGI, motion capture, LED wall backdrops, and other technologies to blend virtual elements with live action in-camera."
  },
  {
    "SERVICE_ID": "1bf4e680-181b-492a-a02e-18a143f0e1b8",
    "SERVICE_NAME": "Character FX",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "1bf4e680-181b-492a-a02e-18a143f0e1b8",
    "SERVICE_L3_NAME": "Character FX",
    "DESCRIPTION": "Simulate character-specific effects such as cloth movement, hair/fur dynamics, and muscle jiggle, so that clothing and hair on CG characters move realistically in line with physics"
  },
  {
    "SERVICE_ID": "1ce7d360-613b-47fa-a669-46f9913f87fc",
    "SERVICE_NAME": "Crowd Simulation",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "1ce7d360-613b-47fa-a669-46f9913f87fc",
    "SERVICE_L3_NAME": "Crowd Simulation",
    "DESCRIPTION": "Use specialized software to animate and simulate large crowds of characters, controlling their behaviors and movements so massive groups look realistic and natural"
  },
  {
    "SERVICE_ID": "9900e5ca-1853-4413-aca9-f117606fdbea",
    "SERVICE_NAME": "Destruction",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "9900e5ca-1853-4413-aca9-f117606fdbea",
    "SERVICE_L3_NAME": "Destruction",
    "DESCRIPTION": "Simulate objects breaking apart, crumbling, or exploding using physics-based effects, creating dramatic destruction scenes that look believably real"
  },
  {
    "SERVICE_ID": "d77b6e95-a013-4f35-a59d-b07d0d356237",
    "SERVICE_NAME": "Liquids",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "d77b6e95-a013-4f35-a59d-b07d0d356237",
    "SERVICE_L3_NAME": "Liquids",
    "DESCRIPTION": "Generate realistic fluid simulations (water, oil, lava, etc.) where liquids flow, splash, and behave naturally according to physics, adding lifelike water and fluid effects to scenes"
  },
  {
    "SERVICE_ID": "1a36d9b9-7bc2-4182-88c6-09bfab438b2e",
    "SERVICE_NAME": "Particles",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "1a36d9b9-7bc2-4182-88c6-09bfab438b2e",
    "SERVICE_L3_NAME": "Particles",
    "DESCRIPTION": "Create and animate large numbers of tiny elements (dust, sparks, magic particles, etc.) to produce natural particle effects like smoke, spray, or fairy dust that enhance visual detail"
  },
  {
    "SERVICE_ID": "27f8c932-5fde-4233-98c9-1632143c08c8",
    "SERVICE_NAME": "Pyro",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "27f8c932-5fde-4233-98c9-1632143c08c8",
    "SERVICE_L3_NAME": "Pyro",
    "DESCRIPTION": "Simulate fire, smoke, and explosions using advanced fluid dynamics, producing realistic flames, billowing smoke, and blasts for high-intensity scenes"
  },
  {
    "SERVICE_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_NAME": "FX-Simulation",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "ed3d404c-905a-4004-9eb2-05ea90140141",
    "SERVICE_L2_NAME": "FX-Simulation",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Simulate complex physical phenomena such as smoke, fire, water, and explosions for a VFX shot."
  },
  {
    "SERVICE_ID": "aefdf238-4ffb-4c00-9b2f-5ab757e8a70e",
    "SERVICE_NAME": "Layout",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "aefdf238-4ffb-4c00-9b2f-5ab757e8a70e",
    "SERVICE_L2_NAME": "Layout",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Create a base 3D assembly of 3D assets, mattes, and cameras to match the environment based on the shot breakdown list."
  },
  {
    "SERVICE_ID": "f058537d-2989-48a3-9702-ea9f45a49658",
    "SERVICE_NAME": "Lighting",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "f058537d-2989-48a3-9702-ea9f45a49658",
    "SERVICE_L2_NAME": "Lighting",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Add digital lights to 3D scenes and simulate global illumination to create believable CG imagery."
  },
  {
    "SERVICE_ID": "00667a18-7d5b-428a-b328-3825df3d6c8f",
    "SERVICE_NAME": "Rendering",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "00667a18-7d5b-428a-b328-3825df3d6c8f",
    "SERVICE_L2_NAME": "Rendering",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Generate final high-quality images or video frames from 3D scenes by processing models, textures, lighting, and effects through computer render engines to produce the photorealistic output."
  },
  {
    "SERVICE_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_NAME": "Visual Effects",
    "SERVICE_L1_ID": "76f427ca-bbb5-47d4-9c99-6fab0524493a",
    "SERVICE_L1_NAME": "Visual Effects",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Design and produce visual effects shots using CGI, miniature models, or other techniques to achieve scenes that cannot be filmed live, bringing fantastical or complex visuals to life."
  },
  {
    "SERVICE_ID": "10e9fbe0-147c-4854-89eb-ac8b4873f784",
    "SERVICE_NAME": "Worldbuilding",
    "SERVICE_L1_ID": "10e9fbe0-147c-4854-89eb-ac8b4873f784",
    "SERVICE_L1_NAME": "Worldbuilding",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "Develop the fictional universe of a story in detail, defining its geography, cultures, history, and rules (everything from ecology to social norms) to create a rich, believable world for the narrative."
  },
  {
    "SERVICE_ID": "27872c99-a0df-453e-ac63-fbf5723aab2b",
    "SERVICE_NAME": "Sculpting",
    "SERVICE_L1_ID": "27872c99-a0df-453e-ac63-fbf5723aab2b",
    "SERVICE_L1_NAME": "Sculpting",
    "SERVICE_L2_ID": "",
    "SERVICE_L2_NAME": "",
    "SERVICE_L3_ID": "",
    "SERVICE_L3_NAME": "",
    "DESCRIPTION": "A digital process of manipulating a 3D model like virtual clay to create organic shapes and fine details not easily achieved with traditional geometric modeling. "
  }
];

/* ----------------------- shared UI bits (mirrors ContentTypes) ----------------------- */
function normalize(s) {
  return String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function Pill({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 1000,
        color: BRAND.ink,
        background: BRAND.fill,
        border: `1px solid rgba(30,42,120,0.18)`,
        padding: "6px 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        background: active ? BRAND.fill : "transparent",
        color: BRAND.ink,
        fontWeight: 1100,
        cursor: "pointer",
        padding: "10px 12px",
        borderRadius: 12,
      }}
    >
      {children}
    </button>
  );
}

function SmallButton({ onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        border: "1px solid rgba(30,42,120,0.18)",
        background: "#FFFFFF",
        color: BRAND.ink,
        fontWeight: 1000,
        cursor: "pointer",
        padding: "8px 10px",
        borderRadius: 12,
      }}
    >
      {children}
    </button>
  );
}

/**
 * This page expects:
 * GET /api/orgs/services/counts
 *   -> { totalsByService: { [serviceNameLower]: number }, totalOrgs: number }
 */
export default function Services() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("reference"); // reference | counts
  const [search, setSearch] = useState("");

  // expand/collapse
  const [openL1, setOpenL1] = useState(() => new Set());
  const [openL2, setOpenL2] = useState(() => new Set());

  // selection
  const [selected, setSelected] = useState(() => new Set());

  // counts (via server endpoint)
  const [countsLoading, setCountsLoading] = useState(false);
  const [countsError, setCountsError] = useState("");
  const [totalsByService, setTotalsByService] = useState(null);
  const [totalOrgs, setTotalOrgs] = useState(null);

  const hierarchy = useMemo(() => {
    const byL1 = new Map();

    for (const r of SERVICES_REFERENCE) {
      const l1 = String(r.SERVICE_L1_NAME || "").trim();
      const l2 = String(r.SERVICE_L2_NAME || "").trim();
      const l3 = String(r.SERVICE_L3_NAME || "").trim();

      if (!l1) continue;

      if (!byL1.has(l1)) {
        byL1.set(l1, { l1, l1Desc: "", l2: [] });
      }

      const l1Node = byL1.get(l1);

      // If row is pure L1 (no L2), treat as L1 description row
      if (!l2 && r.DESCRIPTION && !l1Node.l1Desc) {
        l1Node.l1Desc = r.DESCRIPTION;
      }

      if (l2) {
        // find or add L2
        let l2Node = l1Node.l2.find((x) => x.l2 === l2);
        if (!l2Node) {
          l2Node = { l1, l2, l2Desc: "", l3: [] };
          l1Node.l2.push(l2Node);
        }

        // If row is pure L2 (no L3), treat as L2 description row
        if (!l3 && r.DESCRIPTION && !l2Node.l2Desc) {
          l2Node.l2Desc = r.DESCRIPTION;
        }

        // L3 leaf
        if (l3) {
          l2Node.l3.push({ l1, l2, l3, desc: r.DESCRIPTION || "" });
        }
      }
    }

    // sort stable
    const out = Array.from(byL1.values()).sort((a, b) => a.l1.localeCompare(b.l1));
    for (const l1 of out) {
      l1.l2.sort((a, b) => a.l2.localeCompare(b.l2));
      for (const l2 of l1.l2) l2.l3.sort((a, b) => a.l3.localeCompare(b.l3));
    }
    return out;
  }, []);

  const filteredHierarchy = useMemo(() => {
    const q = normalize(search);
    if (!q) return hierarchy;

    return hierarchy
      .map((l1) => {
        const l1Hit = normalize(l1.l1).includes(q) || normalize(l1.l1Desc).includes(q);

        const l2Hits = l1.l2
          .map((l2) => {
            const l2Hit = normalize(l2.l2).includes(q) || normalize(l2.l2Desc).includes(q);

            const l3Hits = l2.l3.filter(
              (x) => normalize(x.l3).includes(q) || normalize(x.desc).includes(q)
            );

            if (l2Hit) return l2;
            if (l3Hits.length) return { ...l2, l3: l3Hits };
            return null;
          })
          .filter(Boolean);

        if (l1Hit) return l1;
        if (l2Hits.length) return { ...l1, l2: l2Hits };
        return null;
      })
      .filter(Boolean);
  }, [hierarchy, search]);

  function toggleL1(l1) {
    setOpenL1((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(l1)) next.delete(l1);
      else next.add(l1);
      return next;
    });
  }

  function toggleL2(key) {
    setOpenL2((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelected(name) {
    const t = String(name || "").trim();
    if (!t) return;

    setSelected((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function openAll() {
    setOpenL1(new Set(hierarchy.map((x) => x.l1)));
  }

  function closeAll() {
    setOpenL1(new Set());
    setOpenL2(new Set());
  }

  async function fetchCounts() {
    setCountsLoading(true);
    setCountsError("");
    try {
      const res = await fetch(base+"/api/orgs/services/counts");
      if (!res.ok) throw new Error(`Counts endpoint not ready (${res.status})`);
      const json = await res.json();
      setTotalsByService(json?.totalsByService || {});
      setTotalOrgs(Number(json?.totalOrgs || 0));
    } catch (e) {
      console.error(e);
      setTotalsByService(null);
      setTotalOrgs(null);
      setCountsError(
        "Counts are not available yet. Ensure the server endpoint /api/orgs/services/counts exists and is running."
      );
    } finally {
      setCountsLoading(false);
    }
  }

  useEffect(() => {
    if (tab !== "counts") return;
    if (totalsByService) return;
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function viewOrgsWithSelection() {
    if (selected.size === 0) return;
    const params = new URLSearchParams();
    params.set("SERVICES", Array.from(selected).join(","));
    navigate(`/participants/organizations?${params.toString()}`);
  }

  function countFor(serviceName) {
    if (!totalsByService) return null;
    const raw = String(serviceName || "").trim();
    if (!raw) return 0;

    // Robust lookup: try exact key, then normalized-lower key (matches server output)
    return (
      totalsByService?.[raw] ??
      totalsByService?.[normalize(raw)] ??
      0
    );
  }

  const flatRowsForCounts = useMemo(() => {
    const rows = [];
    for (const l1 of hierarchy) {
      // L1 row
      rows.push({ level: "L1", l1: l1.l1, l2: "", l3: "", desc: l1.l1Desc || "" });

      for (const l2 of l1.l2) {
        // L2 row
        rows.push({ level: "L2", l1: l1.l1, l2: l2.l2, l3: "", desc: l2.l2Desc || "" });

        // L3 leaves
        for (const l3 of l2.l3) {
          rows.push({ level: "L3", l1: l3.l1, l2: l3.l2, l3: l3.l3, desc: l3.desc || "" });
        }
      }
    }
    return rows;
  }, [hierarchy]);

  const filteredCountsRows = useMemo(() => {
    const q = normalize(search);
    if (!q) return flatRowsForCounts;

    return flatRowsForCounts.filter((r) => {
      const name = r.level === "L1" ? r.l1 : r.level === "L2" ? r.l2 : r.l3;
      return (
        normalize(name).includes(q) ||
        normalize(r.l1).includes(q) ||
        normalize(r.l2).includes(q) ||
        normalize(r.desc).includes(q)
      );
    });
  }, [flatRowsForCounts, search]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        color: BRAND.text,
        paddingBottom: selected.size > 0 ? 96 : 26,
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 26px 10px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                border: "none",
                background: BRAND.fill,
                color: BRAND.ink,
                fontWeight: 1000,
                padding: "10px 14px",
                borderRadius: 14,
                cursor: "pointer",
                boxShadow: "0 10px 34px rgba(30,42,120,0.12)",
              }}
            >
              ME-NEXUS
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Participants
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>

            <button
              type="button"
              onClick={() => navigate("/participants/organizations")}
              style={{
                border: "none",
                background: "transparent",
                color: BRAND.ink,
                fontWeight: 1000,
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: 10,
              }}
            >
              Organizations
            </button>

            <span style={{ padding: "0 10px", opacity: 0.6 }}>›</span>
            <span style={{ fontWeight: 1000, opacity: 0.95 }}>Services</span>

            {selected.size > 0 ? <Pill>{selected.size} selected</Pill> : null}
          </div>

          <a
            href="https://me-dmz.com"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              color: BRAND.ink,
              fontWeight: 1000,
              opacity: 0.92,
              padding: "10px 12px",
              borderRadius: 12,
              border: `1px solid rgba(30,42,120,0.18)`,
              background: "#FFFFFF",
            }}
          >
            ME-DMZ ↗
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding: "0 26px 16px" }}>
        <div
          style={{
            maxWidth: PAGE.max,
            margin: "0 auto",
            background: "#FFFFFF",
            borderRadius: 18,
            border: `1px solid rgba(30,42,120,0.14)`,
            boxShadow: "0 22px 80px rgba(30,42,120,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: 18,
              borderBottom: "1px solid rgba(30,42,120,0.12)",
              background:
                "linear-gradient(180deg, rgba(207,239,247,0.55), rgba(255,255,255,0.90))",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 1000, color: "rgba(30,42,120,0.75)" }}>
              PARTICIPANT ORGANIZATIONS
            </div>
            <h1 style={{ margin: "6px 0 6px", fontSize: 32, fontWeight: 1100, color: BRAND.ink }}>
              Services
            </h1>
            <p style={{ margin: 0, maxWidth: 1200, fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
              {SERVICES_DEFINITION}
            </p>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  display: "inline-flex",
                  gap: 6,
                  alignItems: "center",
                  padding: 6,
                  borderRadius: 14,
                  border: "1px solid rgba(30,42,120,0.14)",
                  background: "#FFFFFF",
                }}
              >
                <TabButton active={tab === "reference"} onClick={() => setTab("reference")}>
                  Reference
                </TabButton>
                <TabButton active={tab === "counts"} onClick={() => setTab("counts")}>
                  Counts
                </TabButton>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (name or description)"
                style={{
                  flex: "1 1 320px",
                  maxWidth: 520,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(30,42,120,0.18)",
                  fontWeight: 900,
                  color: BRAND.ink,
                  outline: "none",
                }}
              />

              <SmallButton onClick={openAll} title="Expand all L1">
                Expand all
              </SmallButton>
              <SmallButton onClick={closeAll} title="Collapse all">
                Collapse all
              </SmallButton>

              {tab === "counts" ? (
                <SmallButton onClick={fetchCounts} title="Refresh counts from server">
                  Refresh counts
                </SmallButton>
              ) : null}
            </div>

            {tab === "counts" && (countsLoading || countsError || totalsByService) ? (
              <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {countsLoading ? <Pill>Loading counts…</Pill> : null}
                {!countsLoading && countsError ? (
                  <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(17,24,39,0.75)" }}>
                    {countsError}
                  </span>
                ) : null}
                {!countsLoading && !countsError && totalOrgs != null ? (
                  <Pill>Total orgs: {totalOrgs.toLocaleString()}</Pill>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Body */}
          <div style={{ padding: 18 }}>
            {tab === "reference" ? (
              <div>
                {filteredHierarchy.length === 0 ? (
                  <div style={{ padding: 14, fontWeight: 900, opacity: 0.7 }}>No matches.</div>
                ) : null}

                {filteredHierarchy.map((l1) => {
                  const l1Open = openL1.has(l1.l1);

                  return (
                    <div
                      key={l1.l1}
                      style={{
                        border: "1px solid rgba(30,42,120,0.14)",
                        borderRadius: 16,
                        overflow: "hidden",
                        marginBottom: 12,
                        background: "#FFFFFF",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: 14,
                          background: "rgba(207,239,247,0.45)",
                          borderBottom: "1px solid rgba(30,42,120,0.10)",
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => toggleL1(l1.l1)}
                            style={{
                              background: "#FFFFFF",
                              borderRadius: 12,
                              padding: "8px 10px",
                              cursor: "pointer",
                              fontWeight: 1100,
                              color: BRAND.ink,
                              border: "1px solid rgba(30,42,120,0.18)",
                            }}
                          >
                            {l1Open ? "–" : "+"}
                          </button>

                          <span style={{ fontWeight: 1100, color: BRAND.ink, fontSize: 18 }}>
                            {l1.l1}
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleSelected(l1.l1)}
                            style={{
                              border: "1px solid rgba(30,42,120,0.18)",
                              background: selected.has(l1.l1) ? BRAND.fill : "#FFFFFF",
                              color: BRAND.ink,
                              borderRadius: 999,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontWeight: 1100,
                              fontSize: 12,
                            }}
                          >
                            {selected.has(l1.l1) ? "Selected" : "Select"}
                          </button>

                          {totalsByService ? (
                            <Pill>{countFor(l1.l1).toLocaleString()} orgs</Pill>
                          ) : null}
                        </div>
                      </div>

                      {l1.l1Desc ? (
                        <div style={{ padding: "12px 14px", fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
                          {l1.l1Desc}
                        </div>
                      ) : null}

                      {l1Open ? (
                        <div style={{ padding: "0 10px 12px" }}>
                          {l1.l2.map((l2) => {
                            const key = `${l1.l1}__${l2.l2}`;
                            const l2Open = openL2.has(key);

                            return (
                              <div
                                key={key}
                                style={{
                                  margin: "10px 4px",
                                  border: "1px solid rgba(30,42,120,0.12)",
                                  borderRadius: 14,
                                  background: "#FFFFFF",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    padding: 12,
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <button
                                      type="button"
                                      onClick={() => toggleL2(key)}
                                      style={{
                                        border: "1px solid rgba(30,42,120,0.18)",
                                        background: "#FFFFFF",
                                        borderRadius: 12,
                                        padding: "6px 10px",
                                        cursor: "pointer",
                                        fontWeight: 1100,
                                        color: BRAND.ink,
                                      }}
                                    >
                                      {l2Open ? "–" : "+"}
                                    </button>

                                    <span style={{ fontWeight: 1100, color: BRAND.ink }}>
                                      {l2.l2}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => toggleSelected(l2.l2)}
                                      style={{
                                        border: "1px solid rgba(30,42,120,0.18)",
                                        background: selected.has(l2.l2) ? BRAND.fill : "#FFFFFF",
                                        color: BRAND.ink,
                                        borderRadius: 999,
                                        padding: "6px 10px",
                                        cursor: "pointer",
                                        fontWeight: 1100,
                                        fontSize: 12,
                                      }}
                                    >
                                      {selected.has(l2.l2) ? "Selected" : "Select"}
                                    </button>

                                    {totalsByService ? (
                                      <Pill>{countFor(l2.l2).toLocaleString()} orgs</Pill>
                                    ) : null}
                                  </div>
                                </div>

                                {l2.l2Desc ? (
                                  <div style={{ padding: "0 12px 12px", fontWeight: 850, opacity: 0.85, lineHeight: 1.35 }}>
                                    {l2.l2Desc}
                                  </div>
                                ) : null}

                                {l2Open ? (
                                  <div style={{ padding: "0 12px 12px" }}>
                                    {l2.l3.length === 0 ? (
                                      <div style={{ fontWeight: 900, opacity: 0.65, padding: "6px 2px" }}>
                                        No L3 services under this node.
                                      </div>
                                    ) : null}

                                    {l2.l3.map((l3) => (
                                      <div
                                        key={`${l3.l1}__${l3.l2}__${l3.l3}`}
                                        style={{
                                          padding: "10px 10px",
                                          borderRadius: 12,
                                          border: "1px solid rgba(30,42,120,0.10)",
                                          marginTop: 8,
                                          background: "rgba(247,251,254,0.9)",
                                          display: "flex",
                                          alignItems: "flex-start",
                                          justifyContent: "space-between",
                                          gap: 12,
                                        }}
                                      >
                                        <div style={{ minWidth: 0 }}>
                                          <div style={{ fontWeight: 1100, color: BRAND.ink }}>
                                            {l3.l3}
                                          </div>
                                          {l3.desc ? (
                                            <div style={{ marginTop: 4, fontWeight: 850, opacity: 0.82, lineHeight: 1.35 }}>
                                              {l3.desc}
                                            </div>
                                          ) : null}
                                        </div>

                                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                          <button
                                            type="button"
                                            onClick={() => toggleSelected(l3.l3)}
                                            style={{
                                              border: "1px solid rgba(30,42,120,0.18)",
                                              background: selected.has(l3.l3) ? BRAND.fill : "#FFFFFF",
                                              color: BRAND.ink,
                                              borderRadius: 999,
                                              padding: "6px 10px",
                                              cursor: "pointer",
                                              fontWeight: 1100,
                                              fontSize: 12,
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {selected.has(l3.l3) ? "Selected" : "Select"}
                                          </button>

                                          {totalsByService ? (
                                            <Pill>{countFor(l3.l3).toLocaleString()} orgs</Pill>
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {tab === "counts" ? (
              <div
                style={{
                  border: "1px solid rgba(30,42,120,0.14)",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#FFFFFF",
                }}
              >
                <div
                  style={{
                    padding: 14,
                    borderBottom: "1px solid rgba(30,42,120,0.10)",
                    background: "rgba(207,239,247,0.35)",
                    fontWeight: 1100,
                    color: BRAND.ink,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span>Service counts (from the VFX-Animation Dataset)</span>
                  {totalsByService ? <Pill>Rows: {filteredCountsRows.length.toLocaleString()}</Pill> : null}
                </div>

                {!totalsByService ? (
                  <div style={{ padding: 14, fontWeight: 900, opacity: 0.75 }}>
                    Counts not loaded yet. Click <b>Refresh counts</b> above (and ensure the server endpoint exists).
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ textAlign: "left" }}>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>Level</th>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>L1</th>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>L2</th>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>L3</th>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }}>Orgs</th>
                          <th style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.10)" }} />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCountsRows.map((r, idx) => {
                          const name = r.level === "L1" ? r.l1 : r.level === "L2" ? r.l2 : r.l3;
                          const c = countFor(name);

                          return (
                            <tr key={`${r.level}-${r.l1}-${r.l2}-${r.l3}-${idx}`}>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 1000, color: BRAND.ink }}>
                                {r.level}
                              </td>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900 }}>
                                {r.l1}
                              </td>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900 }}>
                                {r.l2}
                              </td>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 900 }}>
                                {r.l3}
                              </td>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)", fontWeight: 1100 }}>
                                {Number(c || 0).toLocaleString()}
                              </td>
                              <td style={{ padding: 12, borderBottom: "1px solid rgba(30,42,120,0.08)" }}>
                                <button
                                  type="button"
                                  onClick={() => toggleSelected(name)}
                                  style={{
                                    border: "1px solid rgba(30,42,120,0.18)",
                                    background: selected.has(name) ? BRAND.fill : "#FFFFFF",
                                    color: BRAND.ink,
                                    borderRadius: 999,
                                    padding: "6px 10px",
                                    cursor: "pointer",
                                    fontWeight: 1100,
                                    fontSize: 12,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {selected.has(name) ? "Selected" : "Select"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Sticky selection bar (mirrors ContentTypes behavior) */}
      {selected.size > 0 ? (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "12px 14px",
            background: "rgba(247,251,254,0.92)",
            borderTop: "1px solid rgba(30,42,120,0.18)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              maxWidth: PAGE.max,
              margin: "0 auto",
              display: "flex",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Pill>{selected.size} selected</Pill>
              {Array.from(selected)
                .slice(0, 10)
                .map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 12,
                      fontWeight: 1000,
                      color: BRAND.ink,
                      background: "#FFFFFF",
                      border: `1px solid rgba(30,42,120,0.18)`,
                      padding: "6px 10px",
                      borderRadius: 999,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s}
                  </span>
                ))}
              {selected.size > 10 ? (
                <span style={{ fontSize: 12, fontWeight: 1000, opacity: 0.7 }}>
                  +{selected.size - 10} more
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                type="button"
                onClick={clearSelection}
                style={{
                  border: "1px solid rgba(30,42,120,0.18)",
                  background: "#FFFFFF",
                  color: BRAND.ink,
                  fontWeight: 1100,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: 12,
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={viewOrgsWithSelection}
                style={{
                  border: "none",
                  background: BRAND.border,
                  color: "#FFFFFF",
                  fontWeight: 1200,
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: 12,
                  boxShadow: "0 14px 40px rgba(30,42,120,0.18)",
                }}
              >
                View organizations →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
