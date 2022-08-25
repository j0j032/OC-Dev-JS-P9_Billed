/**
 * @jest-environment jsdom
 */

 import { fireEvent, screen, waitFor } from "@testing-library/dom";
 import { localStorageMock } from "../__mocks__/localStorage.js";
 import mockStore from "../__mocks__/store";
 import NewBillUI from "../views/NewBillUI.js";
 import NewBill from "../containers/NewBill.js";
 import { ROUTES, ROUTES_PATH } from "../constants/routes";
 
 let newBill;
 let inputFile;
 let inputFileGet;
 
 describe("Given I am connected as an employee", () => {
   beforeAll(() => {
     Object.defineProperty(window, 'localStorage', { value: localStorageMock })
     window.localStorage.setItem('user', JSON.stringify({
       type: 'Employee'
     }))
   })
   describe("When I am on NewBill Page", () => {
     beforeAll(() => {
       document.body.innerHTML = NewBillUI()
       const onNavigate = (pathname) => {
         document.body.innerHTML = ROUTES({ pathname })
       }
       const store = null
       newBill = new NewBill({
         document, onNavigate, store, localStorage: window.localStorage
       })
     })
     test("Then form new bill is displayed", async () => {
       const formNewBill = await waitFor(() => screen.getByTestId('form-new-bill'))
       expect(formNewBill).toBeTruthy()
     })
     describe("test method hasValidExtension(extension, validExtensions)",()=>{
       it ("should return true when extension is valid",()=>{
         expect(newBill.hasValidExtension('jpg')).toEqual(true)
         expect(newBill.hasValidExtension('jpeg')).toEqual(true)
         expect(newBill.hasValidExtension('png')).toEqual(true)
       })
       it ("should return false when extension is not valid",()=>{
         expect(newBill.hasValidExtension('svg')).toEqual(false)
         expect(newBill.hasValidExtension('txt')).toEqual(false)
         expect(newBill.hasValidExtension('pdf')).toEqual(false)
       })
     })
     describe("When i add a file", () => {
       beforeAll(async () => {
         inputFile = await waitFor(() => screen.getByTestId('file'))
         inputFileGet = jest.fn()
         Object.defineProperty(inputFile, 'files', {
           get: inputFileGet
         })
       })
       test("with an invalid extension then an error message is displayed and no file is created", async () => {
         inputFileGet.mockReturnValue([{
           name: 'file.doc',
           size: 12345,
           blob: 'some-blob'
         }])
         const createFile = jest.spyOn(newBill, 'createFile')
 
         fireEvent.change(inputFile)
         const errorExtension = await waitFor(() => screen.getByTestId('error-extension'))
         expect(errorExtension.classList.contains('show-error')).toBe(true)
 
         expect(createFile).not.toHaveBeenCalled()
       })
       test("with a valid extension then a new file is created", async () => {
         inputFileGet.mockReturnValue([{
           name: 'chucknorris.png',
           size: 12345,
           blob: 'some-blob'
         }])
         const createFile = jest.spyOn(newBill, 'createFile')
 
         fireEvent.change(inputFile)
         const errorExtension = await waitFor(() => screen.getByTestId('error-extension'))
         expect(errorExtension.classList.contains('hide-error')).toBe(true)
         expect(createFile).toHaveBeenCalled()
       })
     })
     describe("When i submit new bill form", () => {
       test("Then bill is upserted and i am redirected to bills page", async () => {
         const formNewBill = await waitFor(() => screen.getByTestId('form-new-bill'))
 
         const updateBill = jest.spyOn(newBill, 'updateBill')
         const onNavigate = jest.spyOn(newBill, 'onNavigate')
 
         fireEvent.submit(formNewBill)
 
         expect(updateBill).toHaveBeenCalled()
         expect(onNavigate).toHaveBeenCalled()
       })
       
       /* test("if a file error message is display, then, user can't submit the form", async ()=>{
         const formNewBill = await waitFor(() => screen.getByTestId('form-new-bill'))
         const errorExtension = await waitFor(() => screen.getByTestId('error-extension'))
 
         errorExtension.classList.add('show-error')
         console.log(errorExtension);
         
         const onNavigate = jest.spyOn(newBill, 'onNavigate')
 
         fireEvent.submit(formNewBill)
 
         expect(onNavigate).not.toHaveBeenCalled()
       }) */
     })
   })
 })