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
let formNewBill;

describe("Given I am connected as an employee", () => {
  beforeAll(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
  });
  describe("When I am on NewBill Page", () => {
    beforeAll(() => {
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
    });
    test("Then form new bill is displayed", async () => {
      const formNewBill = await waitFor(() => screen.getByTestId("form-new-bill"));
      expect(formNewBill).toBeTruthy();
    });
    describe("test method hasValidExtension(extension, validExtensions)", () => {
      it("should return true when extension is valid", () => {
        expect(newBill.hasValidExtension("jpg")).toEqual(true);
        expect(newBill.hasValidExtension("jpeg")).toEqual(true);
        expect(newBill.hasValidExtension("png")).toEqual(true);
      });
      it("should return false when extension is not valid", () => {
        expect(newBill.hasValidExtension("svg")).toEqual(false);
        expect(newBill.hasValidExtension("txt")).toEqual(false);
        expect(newBill.hasValidExtension("pdf")).toEqual(false);
      });
    });
    describe("When i add a file", () => {
      beforeAll(async () => {
        inputFile = await waitFor(() => screen.getByTestId("file"));
        inputFileGet = jest.fn();
        Object.defineProperty(inputFile, "files", {
          get: inputFileGet,
        });
      });
      test("with an invalid extension then an error message is displayed and no file is created", async () => {
        inputFileGet.mockReturnValue([
          {
            name: "file.doc",
            size: 12345,
            blob: "some-blob",
          },
        ]);
        const createFile = jest.spyOn(newBill, "createFile");

        fireEvent.change(inputFile);
        const errorExtension = await waitFor(() => screen.getByTestId("error-extension"));
        expect(errorExtension.classList.contains("show-error")).toBe(true);

        expect(createFile).not.toHaveBeenCalled();
      });
      test("with a valid extension then a new file is created", async () => {
        inputFileGet.mockReturnValue([
          {
            name: "chucknorris.png",
            size: 12345,
            blob: "some-blob",
          },
        ]);
        const createFile = jest.spyOn(newBill, "createFile");

        fireEvent.change(inputFile);
        const errorExtension = await waitFor(() => screen.getByTestId("error-extension"));
        expect(errorExtension.classList.contains("hide-error")).toBe(true);
        expect(createFile).toHaveBeenCalled();
      });
    });
    describe("When I submit new bill form", () => {
      beforeAll(async () => {
        formNewBill = await waitFor(() => screen.getByTestId("form-new-bill"));
      });
      test("Then bill is upserted and i am redirected to bills page", () => {
        const updateBill = jest.spyOn(newBill, "updateBill");
        const onNavigate = jest.spyOn(newBill, "onNavigate");

        fireEvent.submit(formNewBill);

        expect(updateBill).toHaveBeenCalled();
        expect(onNavigate).toHaveBeenCalled();
      });

      test("if wrong upload file is not updated, it should display an error", async () => {
        document.body.innerHTML = NewBillUI();
        const errorExtension = await waitFor(() => screen.getByTestId("error-extension"));
        errorExtension.classList.add("show-error");

        const displayErrorOnSubmit = jest.spyOn(newBill, "displayErrorOnSubmit");

        fireEvent.submit(formNewBill);

        expect(displayErrorOnSubmit).toHaveBeenCalled();
      });
    });
    describe("test method displayErrorOnSubmit()", () => {
      beforeAll(() => {
        jest.useFakeTimers();
      });
      it("should call setTimeOut for 2second", () => {
        const mockSetTimeOut = jest.spyOn(global, "setTimeout");
        newBill.displayErrorOnSubmit();
        expect(mockSetTimeOut).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 2000);
      });

      test("at the end, the error should be removed", async () => {
        document.body.innerHTML = NewBillUI();
        const errorSubmission = await waitFor(() => screen.getByTestId("error-submit"));
        expect(errorSubmission.classList.contains("hide-error")).toBe(true);
        expect(errorSubmission.classList.contains("show-error")).toBe(false);
      });
    });
  });

  // Test POST

  describe("Test API createFile method", () => {
    beforeAll(() => {
      jest.mock("../app/store", () => mockStore);
      jest.spyOn(mockStore, "bills");
      document.body.innerHTML = NewBillUI();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = mockStore;
      newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
    });
    test("POST data then get fileUrl and key", async () => {
      await newBill.createFile({});
      expect(newBill.fileUrl).toEqual("https://localhost:3456/images/test.jpg");
      expect(newBill.billId).toEqual("1234");
    });
    test("POST data to API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      await expect(newBill.createFile({})).rejects.toEqual(new Error("Erreur 404"));
    });
    test("POST data to API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      await expect(newBill.createFile({})).rejects.toEqual(new Error("Erreur 500"));
    });
  });
});
