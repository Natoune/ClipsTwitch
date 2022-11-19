require('dotenv').config();
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const request                = require('request');
const { DownloaderHelper }   = require('node-downloader-helper');
const fs                     = require('fs');
const path                   = require('path');
const ffmpeg                 = require('ffmpeg');
const concat                 = require('ffmpeg-concat');

// Define our constants, you will change these with your own
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_SECRET    = process.env.TWITCH_SECRET;
const auth = new ClientCredentialsAuthProvider(TWITCH_CLIENT_ID, TWITCH_SECRET);

const TOP_STREAMERS_NAME = [
	'otplol_',
	'aminematue',
	'Kamet0',
	'JLTomy',
	'AntoineDaniel',
	'Squeezie',
	'Etoiles',
	'Gotaga',
	'Domingo',
	'ZeratoR',
	'Joueur_du_Grenier',
	'Ponce',
	'Pauleta_Twitch',
	'WankilStudio',
	'Mynthos',
	'Sardoche',
	'RocKy_',
	'ScreaM',
	'chowh1',
	'Locklear',
	'kronopanpanetronre',
	'1PVCS',
	'RocketBaguette',
	'BagheraJones',
	'Chap_GG',
	'Shaunz',
	'SolaryHS',
	'lestream',
	'Altair',
	'Tonton',
	'Xari',
	'jbzzed',
	'HortyUnderscore',
	'BruceGrannec',
	'mistermv',
	'Jolavanille',
	'Shisheyu_Mayamoto',
	'PapeSan',
	'SkyrrozTV',
	'Bichouu_',
	'samueletienne',
	'Solary',
	'Kaydop',
	'Alderiate',
	'Alexclick',
	'Maghla',
	'YassEncore',
	'KmSenKangoo',
	'MasterSnakou',
	'MaximeBiaggi'
];

let clips = [];
let clipFiles = [];
let temp = [];
let clipsReceived = false;

auth.getAccessToken().then(accessToken => {
	getClips(async () => {
		if (clipsReceived) return;
		else clipsReceived = true;
	
		clips = clips.sort((a,b) => (a.view_count < b.view_count) ? 1 : ((b.view_count < a.view_count) ? -1 : 0));
	
		downloadClip(clips[0], () => {
			downloadClip(clips[1], () => {
				downloadClip(clips[2], () => {
					downloadClip(clips[3], () => {
						downloadClip(clips[4], () => {
							downloadClip(clips[5], () => {
								creating();
							});
						});
					});
				});
			});
		});
	});
	
	async function creating() {
		treatVideo(0, () => {
			treatVideo(1, () => {
				treatVideo(2, () => {
					treatVideo(3, () => {
						treatVideo(4, () => {
							treatVideo(5, () => {
								if (fs.existsSync(path.join(__dirname, `output.mp4`)))
									fs.unlink(path.join(__dirname, `output.mp4`), err => { if (err) console.log(err) });
				
								console.log('Concaténation des vidéos...');
								
								conc('temp0', 'temp1', 'temp2', 'temp3', 'temp4', 'temp5', () => {
									console.log('TERMINÉ !');
								});
								
								function conc(in0, in1, in2, in3, in4, in5, _callback) {
									concat({
										output: path.join(__dirname, `output\\${Date.now.toString}.mp4`),
										videos: [
											path.join(__dirname, `files\\${in0}.mp4`),
											path.join(__dirname, `files\\${in1}.mp4`),
											path.join(__dirname, `files\\${in2}.mp4`),
											path.join(__dirname, `files\\${in3}.mp4`),
											path.join(__dirname, `files\\${in4}.mp4`),
											path.join(__dirname, `files\\${in5}.mp4`),
											path.join(__dirname, `files\\${Math.floor(Math.random() * 18)}.mp4`),
										],
										transition: {
											name: 'CrossZoom',
											duration: 500
										},
										cleanupFrames: true,
										tempDir: 'D:\\temp'
									}).then(() => {
										fs.rm('D:\\temp', () => {
											_callback();
										});
									});
								}
							});
						});
					});
				});
			});
		});
	}
	
	function treatVideo(i, _callback) {
		console.log('Traitement de ' + clipFiles[i] + '...');
		if (fs.existsSync(path.join(__dirname, `files\\temp${i}.mp4`)))
			fs.unlink(path.join(__dirname, `files\\temp${i}.mp4`), err => { if (err) console.log(err) });
		
		try {
			new ffmpeg(clipFiles[i], (err, video) => {
				if (!err) {
					video.fnAddWatermark(path.join(__dirname, `files\\${clipFiles[i].split('\\')[clipFiles[i].split('\\').length-1].replace('.mp4', '.png')}`), path.join(__dirname, `files\\temp${i}.mp4`), {
						margin_nord: 0,
						margin_west: 0
					}).then(() => {
						// new ffmpeg(clipFiles[i].replace('.mp4', '') + '_watermark_' + clipFiles[i].split('\\')[clipFiles[i].split('\\').length-1], (err, video) => {
						// 	if (!err) {
						// 		video.addCommand('-c', 'copy');
						// 		video.addCommand('-bsf:v', 'h264_mp4toannexb');
						// 		video.addCommand('-f', 'mpegts');
			
						// 		video.save(path.join(__dirname, `files\\temp${i}.ts`), () => {
									console.log(`temp${i}.mp4 créé`);
									temp.push(path.join(__dirname, `files\\temp${i}.mp4`));
		
									// fs.unlink(clipFiles[i].replace('.mp4', '') + '_watermark_' + clipFiles[i].split('\\')[clipFiles[i].split('\\').length-1], () => {
										_callback();
									// });
						// 		});
						// 	} else {
						// 		console.log(err);
						// 		_callback();
						// 	}
						// });
					});
				} else {
					console.log('Error: ' + err);
					_callback();
				}
			});
		} catch (e) {
			console.log(e.code);
			console.log(e.msg);
			_callback();
		}
	}
	
	function getClips(_callback) {
		let i = 0;
		let j = 0;
	
		let options = {
			'method': 'GET',
			'url': 'https://api.twitch.tv/helix/users?login=' + TOP_STREAMERS_NAME.join('&login='),
			'headers': {
			  'Authorization': `Bearer ${accessToken.accessToken}`,
			  'Client-Id': TWITCH_CLIENT_ID,
			  'Accept': 'application/json'
			}
		};
	
		request(options, function (error, response) {
			if (error) console.log(error);
			else {
				const TOP_STREAMERS = JSON.parse(response.body).data;
	
				for (streamer of TOP_STREAMERS) {
					let date = new Date();
					date.setDate(date.getDate() - 7);
					let options = {
						'method': 'GET',
						'url': 'https://api.twitch.tv/helix/clips?first=20&started_at=' + date.toISOString() + '&broadcaster_id=' + streamer.id,
						'headers': {
							'Authorization': `Bearer ${accessToken.accessToken}`,
							'Client-Id': TWITCH_CLIENT_ID,
							'Accept': 'application/json'
						}
					};
	
					request(options, function (error, response) {
						if (error) console.log(error);
						else {
							for (let clip of JSON.parse(response.body).data) {
								clips.push(clip);
							}
						}
	
						if (i >= TOP_STREAMERS.length) {
							if (j >= 20) return _callback();
							j++;
						}
					});
	
					i++;
				}
			}
		});
	}
	
	async function downloadClip(clip, _callback) {
		const dl = new DownloaderHelper(clip.thumbnail_url.replace(/-preview-[0-9]+x[0-9]+.(.*)/g, '.mp4'), path.join(__dirname, 'files'), {
			fileName: clip.id + '.mp4'
		});
	
		if (!fs.existsSync(path.join(__dirname, 'files\\' + clip.id + '.png'))) {
			const waterMarkDl = new DownloaderHelper('https://natoune.tk/watermark.php?t=' + encodeURI(clip.broadcaster_name), path.join(__dirname, 'files'), {
				fileName: clip.id + '.png'
			});
			waterMarkDl.start();
		}
	  
		console.log('\r\nPréparation du téléchargement de ' + clip.id + '.mp4...');
	
		if (fs.existsSync(path.join(__dirname, 'files\\' + clip.id + '.mp4'))) {
			await dl.getTotalSize().then(size => {
				if (fs.statSync(path.join(__dirname, 'files\\' + clip.id + '.mp4'))['size'] >= size.total) {
					console.log('La vidéo ' + size.name + ' est déjà entièrement téléchargé sur le disque ! Téléchargement suivant...');
					clipFiles.push(path.join(__dirname, `files\\${clip.id}.mp4`));
					return _callback();
				} else {
					fs.unlink(path.join(__dirname, 'files\\' + clip.id + '.mp4'), err => { if (err) console.log(err) });
				}
			});
		} else {
			dl.on('progress', progress => {
				process.stdout.clearLine();
				process.stdout.cursorTo(0);
				process.stdout.write((progress.downloaded / 1048576).toFixed(2) + ' / ' + (progress.total / 1048576).toFixed(2) + ' MB téléchargés (' + progress.progress.toFixed(0) + '%)');
			});
			dl.on('end', (result) => {
				console.log('\r\n' + clip.id + '.mp4 (' + (result.totalSize / 1048576).toFixed(2) + ' MB) a été téléchargé avec succès !');
				clipFiles.push(result.filePath);
				_callback();
			});
			dl.start();
		}
	}	
});
