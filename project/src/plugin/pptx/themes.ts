//src/plugin/pptx/themes.ts
import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'office',
    name: 'Office',
    background: { color: '#FFFFFF' },
    fontFamily: 'Calibri, Arial, sans-serif',
    colors: {
      primary: '#2F5496', // Dark Blue
      secondary: '#444444',
      accent1: '#4472C4', // Blue
      accent2: '#ED7D31', // Orange
      accent3: '#A5A5A5', // Gray
      accent4: '#FFC000', // Yellow
    },
  },
  {
    id: 'droplet',
    name: 'Droplet',
    background: { gradient: 'linear-gradient(to bottom, #F0F4F8, #D9E2EC)' },
    fontFamily: 'Verdana, Geneva, sans-serif',
    colors: {
      primary: '#005A9E',
      secondary: '#333333',
      accent1: '#4A90E2',
      accent2: '#50E3C2',
      accent3: '#7ED321',
      accent4: '#F5A623',
    },
  },
  {
    id: 'ion',
    name: 'Ion',
    background: { color: '#F8F9FA' },
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    colors: {
      primary: '#0078D4',
      secondary: '#323130',
      accent1: '#107C10',
      accent2: '#5C2D91',
      accent3: '#D83B01',
      accent4: '#B4009E',
    },
  },
  {
    id: 'organic',
    name: 'Organic',
    background: { gradient: 'linear-gradient(to right, #F3F9E3, #E8F5E9)' },
    fontFamily: 'Georgia, "Times New Roman", Times, serif',
    colors: {
      primary: '#43A047',
      secondary: '#555555',
      accent1: '#7CB342',
      accent2: '#C0CA33',
      accent3: '#FDD835',
      accent4: '#FB8C00',
    },
  },
  {
    id: 'gallery',
    name: 'Gallery',
    background: { color: '#222222' },
    fontFamily: 'Helvetica, Arial, sans-serif',
    colors: {
      primary: '#FFFFFF',
      secondary: '#DDDDDD',
      accent1: '#00BFFF',
      accent2: '#FF4500',
      accent3: '#ADFF2F',
      accent4: '#DA70D6',
    },
  },
  {
    id: 'wisp',
    name: 'Wisp',
    background: { gradient: 'radial-gradient(circle, #E3F2FD, #FFFFFF)' },
    fontFamily: '"Trebuchet MS", "Lucida Sans Unicode", "Lucida Grande", "Lucida Sans", Arial, sans-serif',
    colors: {
      primary: '#607D8B',
      secondary: '#455A64',
      accent1: '#90A4AE',
      accent2: '#B0BEC5',
      accent3: '#CFD8DC',
      accent4: '#ECEFF1',
    },
  },
  {
    id: 'celestial',
    name: 'Celestial',
    background: { gradient: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
    fontFamily: '"Century Gothic", sans-serif',
    colors: {
        primary: '#E0E0E0',
        secondary: '#BDBDBD',
        accent1: '#4FC3F7',
        accent2: '#FDD835',
        accent3: '#81C784',
        accent4: '#FF8A65',
    }
  },
  {
    id: 'retro',
    name: 'Retro',
    background: { color: '#FDF6E3' }, // Solarized Light
    fontFamily: '"Courier New", Courier, monospace',
    colors: {
        primary: '#657B83', // Solarized Base00
        secondary: '#586E75', // Solarized Base01
        accent1: '#D33682', // Magenta
        accent2: '#2AA198', // Cyan
        accent3: '#B58900', // Yellow
        accent4: '#CB4B16', // Orange
    }
  }
];
