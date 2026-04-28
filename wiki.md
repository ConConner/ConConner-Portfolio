If you are self-hosting your own translations and/or hack patches, you can embed Rom Patcher JS and provide a nice solution for your users, allowing them to easily apply your patches to their ROMs without requiring them to download a single file, all thanks to the magic of the web!

Take a look at [`index_template.html`](https://github.com/marcrobledo/RomPatcher.js/blob/master/index_template.html) for a template. Basically you need to:

1. [Download the latest version](https://github.com/marcrobledo/RomPatcher.js/releases) and copy the entire `rom-patcher-js/` folder to your site
2. Include the CSS and JS file imports from the `<header>` into yours:
	```html
	<link type="text/css" rel="stylesheet" href="./rom-patcher-js/style.css" media="all" />
	<script type="text/javascript" src="./rom-patcher-js/RomPatcher.webapp.js"></script>
	```
3. Copy the needed HTML structure from `index_template.html`:
	```html
	<div id="rom-patcher-container">
		...
	</div>
	```
4. Build a quick patcher with a simple call to `RomPatcherWeb.initialize`:
	```html
	<script type="text/javascript">
		window.addEventListener('load', function(){
			const myPatcherSettings={
				language: 'en',
				requireValidation: false, /* if true, user won't be able to apply patch if the provided ROM is not valid*/
				allowDropFiles: false /* if true, it adds basic drag and drop support */
			};
			RomPatcherWeb.initialize(myPatcherSettings, 'my_patch.ips');
		});
	</script>
	```
5. Customize `style.css` at your own

&nbsp;
# Providing additional patch information
If you want to improve the user experience, you can provide additional information of your patches.<br/>
Instead of a simple file path, you can build a JSON object like this:
```js
RomPatcherWeb.initialize(myPatcherSettings, {
	file: 'my_hack.ips',
	name: 'My game improvement (v2.0)', //patch name that will appear in the dropdown button
	inputCrc32: 0xdeadbeef, //add CRC32 checksum validation to patch
	inputMd5: 'cafebabecafebabecafebabecafebabe', //add MD5 checksum validation to patch (must be a string!)
	description: 'This patch translates the game and fixes bugs!', //short description that will appear when user picks this patch
	outputName: 'My game (Hack)' //patched ROM name
});
```
It is recommended, though, to store the patch or patches in a single zip file:
```js
RomPatcherWeb.initialize(myPatcherSettings, {
	file: 'my_patches.zip', //zip containing patches
	patches: [ //information about patches inside the zip
		{
			file: 'my_hack.ips', //required, must match the patch file name in the zip
			name: 'My game improvement hack (v2.0)',
			inputCrc32: [0xdeadbeef, 0xd0d0cafe], //an array of valid checksums
			description: 'This patch translates the game and fixes bugs! (Recommended)',
			outputName: 'My game improvement'
		},
		{
			file: 'my_hack_vanilla.ips',
			name: 'My game improvement hack (v2.0, no bugfixes)',
			inputCrc32: [0xdeadbeef, 0xd0d0cafe],
			description: 'This patch translates the game but keeps the original game\'s bugs untouched for a vanilla experience',
			outputName: 'My game improvement'
		},
		/* ... */
	]
});
```
You can define some patches as optional. They won't appear in the select dropdown but as checkboxes. User will be able to choose and combine several patches.
```js
RomPatcherWeb.initialize(myPatcherSettings, {
	file: 'my_patches.zip', //zip containing patches
	patches: [ //information about patches inside the zip
		{
			file: 'my_main_patch.ips', //required
			name: 'My game improvement hack (Base)',
		},
		{
			file: 'my_optional_patch_1.ips',
			name: 'Alternate colors',
			description: 'Check this to change main characters\' colors',
			optional: true
		},
		{
			file: 'my_optional_patch_2.ips',
			name: 'Hard mode',
			description: 'Check this to alter game\'s difficulty',
			optional: true
		},
		/* ... */
	]
});
```


&nbsp;
# Events
If you want to go further, you can run your own code via events:
```js
const myPatcherSettings={
	language: 'en',

	oninitialize: function (romFile) {
		/* triggered when Rom Patcher JS has been initialized */
	},
	onloadrom: function (romFile) {
		/* triggered when user provides a ROM and before validating it */
		/* can be used to: */
		/* - modify it before validation  (e.g. add/remove/fix header, change endianness...) */
		/* - to switch to another patch file in the dropdown selector */
	},
	onvalidaterom: function (romFile, isRomValid) {
		/* triggered after ROM is validated */
		/* can be used to show a custom error message if provided ROM is not valid */
	},
	onloadpatch: function (patchFile, embededPatchInformation) {
		/* triggered when user selects a patch from the dropdown */
		/* can be used to toggle HTML elements in your site depending on the selected patch */
	},
	onpatch: function (romFile) {
		/* triggered a ROM is patched */
		/* can be used to modify it before the patched ROM file is saved */
	}
};
```
In all events, the `romFile` parameter is an instance of [BinFile.js](https://github.com/marcrobledo/RomPatcher.js/blob/master/rom-patcher-js/modules/BinFile.js), which allows easy file data and name manipulation.



&nbsp;
## Example: Fix ROM endianness
N64 ROM files are usually stored in `.z64` (Big Endian) or `.n64` (Little Endian) formats. You can make your patcher compatible with both formats by changing the provided ROM file endianness before patching (and then restoring it after patching).<br/>
```js
	const SSB_LITTE_ENDIAN_CRC32 = 0xf0b7c200;
	var romIsLittleEndian;

	RomPatcher.initialize(
		{
			onloadrom:function(romFile, patch){
				/* if ROM is little endian */
				if(romFile.getExtension()==='n64' && romFile.hashMD5()===SSB_LITTE_ENDIAN_CRC32){
					/* change endianness to big */
					romFile.swapBytes(4);
					/* change extension */
					romFile.setExtension('z64');

					romIsLittleEndian=true;
				}else{
					romIsLittleEndian=false;
				}
			},
			onpatch:function(patchedRomFile){
				/* if ROM was little endian */
				if(romIsLittleEndian){
					/* revert endianness to little */
					romFile.swapBytes(4);
					/* revert extension */
					romFile.setExtension('n64');
				}
			}
		}, {
			file: 'smashremix1.5.2.xdelta',
			inputCrc32: 0xeb97929e,
			name: 'Smash Remix v1.5.2',
			outputName: 'Smash Remix v1.5.2 (Hack)'
		}
	);
```

&nbsp;
## Example: Choose correct patch automatically
If your zip file contains several patches for different ROMs, you can make Rom Patcher JS so it picks automatically the patch for the provided ROM.
```js
	const SML2_CHECKSUM_WORLD = 0xd5ec24e4;
	const SML2_CHECKSUM_JAPAN = 0xa715daf5;
	const SML2_CHECKSUMS_INVALID = [0xe6f886e5, 0x635a9112, 0xbf733e10, 0x29e0911a]; /* incompatible SML2 revisions */

	RomPatcher.initialize(
		{
			onloadrom: function (romFile) {
				const crc32 = romFile.hashCRC32();
				/* if ROM region is USA/Europe */
				if (crc32 === SML2_CHECKSUM_WORLD)
					RomPatcherWeb.pickEmbededFile('SML2DXv181.ips');
				/* if ROM region is Japan */
				else if (crc32 === SML2_CHECKSUM_JAPAN)
					RomPatcherWeb.pickEmbededFile('SML2DXv181_jap.ips');
			},
			onvalidaterom: function (romFile, isRomValid) {
				const crc32 = romFile.hashCRC32();
				/* if ROM is a known SML2 revision that is not compatible with the patch */
				if (!isRomValid && SML2_CHECKSUMS_INVALID.indexOf(crc32) !== -1)
					RomPatcherWeb.setErrorMessage('Please provide a v1.0 SML2 ROM');
			}
		}, {
			file: 'SML2DXv181.zip',
			patches: [
				{
					file: 'SML2DXv181.ips',
					name: 'Super Mario Land 2 DX - 6 Golden Coins (v1.8.1)',
					inputCrc32: SML2_CHECKSUM_WORLD,
					description: 'SML2 colorization hack (USA/Europe) by toruzz',
					outputName: 'Super Mario Land 2 DX - 6 Golden Coins (Hack)',
					outputExtension: 'gbc'
				},
				{
					file: 'SML2DXv181_jap.ips',
					name: 'Super Mario Land 2 DX - 6-tsu no Kinka (v1.8.1)',
					inputCrc32: SML2_CHECKSUM_JAPAN,
					description: 'SML2 colorization hack (Japan) by toruzz',
					outputName: 'Super Mario Land 2 DX - 6-tsu no Kinka (Hack)',
					outputExtension: 'gbc'
				}
			]
		}
	);
```

&nbsp;
## Example: Remove header
SNES ROM files are usually stored in `.sfc` (headerless) or `.smc` (headered) formats. You can make your patcher compatible with both formats by detecting if the ROM is headered and remove the header before the ROM is validated.<br/>
```js
	RomPatcher.initialize(
		{
			onloadrom: function (romFile) {
				const SMC_HEADER_SIZE=512;
				if(romFile.getExtension()==='smc' && ((romFile.fileSize - SMC_HEADER_SIZE) % 0x20000) === 0){
					romFile.removeLeadingBytes(SMC_HEADER_SIZE);
					romFile.setExtension('sfc');
					console.log('removed SMC header');
				}
			}
		}, {
			file: 'Tekkaman Blade v1.0.rup',
			name: 'English translation by D and Near',
			outputName: 'Uchuu no Kishi Tekkaman Blade (English v1.0)',
		}
	);
```

&nbsp;
## Example: Detect selected patch
By detecting which patch the user selected, you can do cool things in your site like showing different screenshots.
```js
	RomPatcher.initialize(
		{
			onloadpatch: function (patchFile, embededPatchInformation) {
				if (patchFile.getName() === 'legend_of_mana_sword_amanda') {
					document.getElementById('screenshots_amanda').style.display = 'block';
					document.getElementById('screenshots_duke').style.display = 'none';
				}else if(patchFile.getName() === 'legend_of_mana_sword_duke'){
					document.getElementById('screenshots_amanda').style.display = 'none';
					document.getElementById('screenshots_duke').style.display = 'block';
				}
			}
		}, {
			file: 'legend_of_mana_sword.zip',
			name: 'Legend of the Mana sword',
			patches: [
				{
					file: 'legend_of_mana_sword_amanda.ips',
					description: 'With this patch, you will play as Amanda',
					outputName: 'Legend of Mana sword (Amanda version)'
				},
				{
					file: 'legend_of_mana_sword_duke.ips',
					description: 'With this patch, you will play as Duke',
					outputName: 'Legend of Mana sword (Duke version)'
				}
			]
		}
	);
```

&nbsp;
## Example: Change embeded patches
You can reset the embeded patches easily, so you could offer a Rom Patcher JS compatible with different games.
```js
	RomPatcher.setEmbededPatches({
			file: 'other_patches.zip',
			name: 'Other patches',
			patches: [
				/* ... */
			]
	});
```