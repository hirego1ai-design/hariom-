const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const routeMapPath = 'C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\scratch\\e_series_route_map.json';
const screensDir = 'C:\\Users\\RaAz\\.gemini\\antigravity\\brain\\eb0d8c77-5685-4988-8d8d-5d664efaa344\\scratch\\stitch_screens';
const srcAppDir = path.join(__dirname, '../src/app');


function convertHtmlToJsx(html) {
    let jsx = html
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/onclick="[^"]*"/g, '')
        .replace(/<!--(.*?)-->/gs, '{/* $1 */}')
        .replace(/<img([^>]*[^\/])>/g, '<img$1 />')
        .replace(/<input([^>]*[^\/])>/g, '<input$1 />')
        .replace(/<br([^>]*[^\/])>/g, '<br$1 />')
        .replace(/<hr([^>]*[^\/])>/g, '<hr$1 />')
        .replace(/style="font-variation-settings: 'FILL' 1;"/g, "style={{ fontVariationSettings: \"'FILL' 1\" }}")
        .replace(/style="font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;"/g, "style={{ fontVariationSettings: \"'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24\" }}")
        .replace(/style="width:\s*([^"]+)"/g, "style={{ width: '$1' }}")
        .replace(/style="width:\s*([^"]+);"/g, "style={{ width: '$1' }}")
        .replace(/style="[^"]*"/g, '');

    return jsx;
}

async function run() {
    const routeMap = JSON.parse(fs.readFileSync(routeMapPath, 'utf8'));

    for (const routeObj of routeMap) {
        const { id, route, file } = routeObj;
        const htmlFilePath = path.join(screensDir, file);
        
        if (!fs.existsSync(htmlFilePath)) {
            console.log("Missing file " + file);
            continue;
        }

        const rawHtml = fs.readFileSync(htmlFilePath, 'utf8');
        const $ = cheerio.load(rawHtml);
        
        const mainInnerHtml = $('main').html();
        if (!mainInnerHtml) {
            console.log("No <main> found in " + file);
            continue;
        }

        let jsxContent = convertHtmlToJsx(mainInnerHtml);

        const componentCode = [
            '"use client";',
            '',
            'import React from "react";',
            'import EmployerHeader from "@/components/employer/EmployerHeader";',
            '',
            'export default function EmployerPage' + id + '() {',
            '  return (',
            '    <>',
            '      {/*',
            '        This is an auto-generated component. ',
            '        In Phase 4, we will manually hook up the EmployerContext to interactive elements.',
            '      */}',
            jsxContent,
            '    </>',
            '  );',
            '}'
        ].join('\n');

        const targetDir = path.join(__dirname, '../src/app', route);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(targetDir, 'page.tsx'), componentCode);
        console.log("Converted " + id + " -> " + route + "/page.tsx");
    }
}

run();
