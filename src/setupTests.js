// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Mock 'ogl' (ESM library) for Jest environment which doesn't transform
// node_modules by default. CircularCarousel imports named exports from
// 'ogl' (Camera, Mesh, Plane, Program, Renderer, Transform). Provide
// lightweight mock implementations so tests can run in Node/JSDOM.
jest.mock('ogl', () => ({
	Camera: class Camera {},
	Mesh: class Mesh {},
	Plane: class Plane {},
	Program: class Program {},
	Renderer: class Renderer {},
	Transform: class Transform {},
}));
