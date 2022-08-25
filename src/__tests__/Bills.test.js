/**
 * @jest-environment jsdom
 */

 import {fireEvent, screen, waitFor} from "@testing-library/dom"
 import userEvent from '@testing-library/user-event'
 import mockStore from "../__mocks__/store"
 import BillsUI from "../views/BillsUI.js"
 import { bills, fakeDateBills, nullStatusBills } from "../fixtures/bills.js"
 import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
 import {localStorageMock} from "../__mocks__/localStorage.js"
 import router from "../app/Router.js"
 import Bills from "../containers/Bills.js"
 
 import { formatDate, formatStatus } from "../app/format.js"
 jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  beforeAll(() => { // La on créé l'environnement pour nos test
    Object.defineProperty(window, "localStorage", { value: localStorageMock }); // on définit la valeur de localStorage de l'objet window comme étant le mock du storage
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      }) // on dit à notre local storage qu'on est sur un type employee
    );

    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    // j'appelle le router (c'est un export default et dans l'import, je peux lui donner le nom que je veux...) => le routeur, c'est lui qui permet de naviguer sur la bonne page en fonction des routes(ROUTES et ROUTE_PATH)
  });

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills); 
      // quand on arrive sur la page bills
      await waitFor(() => screen.getByTestId("icon-window")); 
      // on attend que le dom s'affiche pour selectionner l'élément
      const windowIcon = screen.getByTestId("icon-window"); 
      // on selectionne l'icon
      expect(windowIcon.classList).toContain("active-icon"); 
      // et on vérifie si l'icône contient la classe qui determine qu'il est highlighted
    });

    test("Then bills should be ordered from earliest to latest", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
        // on détermine la page affichée pour instancier notre class bill grâce au router appeler avant chaque test
      };
      const store = mockStore;
      // on simule notre store api avec un mock pour pouvoir instancier correctement notre class
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage // le mock a été définit dans le before all
      });

      document.body.innerHTML = BillsUI({ data: bills.sort(bill.byDESCDate) });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML); 
      const datesUnsorted = dates.reverse() 
      expect(dates).toEqual(datesUnsorted.sort(bill.byDESCDate));
    });

    describe("When I click on 'new bill btn'", () => {
      test("Then I should be sent on 'NewBill' page", async () => {
        document.body.innerHTML = BillsUI({ data: bills });

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const bill = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage
        });

        const buttonNewBill = screen.getByTestId("btn-new-bill");
        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));
        buttonNewBill.addEventListener("click", handleClickNewBill);
        fireEvent.click(buttonNewBill);

        expect(handleClickNewBill).toHaveBeenCalled();
        const formNewBill = await waitFor(() => screen.getByTestId("form-new-bill"));
        expect(formNewBill).toBeTruthy();
      });
    })
    describe("When I click on 'iconEye' ", () => {
      it("should open a modal with bill proof", async () => {
        document.body.innerHTML = BillsUI({ data: [bills[0]] });

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const bill = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage
        });

        await waitFor(() => screen.getAllByTestId("icon-eye")[0]);
        const iconEye = screen.getAllByTestId('icon-eye')[0]
        $.fn.modal = jest.fn()
        const handleClickIconEye = jest.fn(()=> bill.handleClickIconEye(iconEye))
        iconEye.addEventListener('click', handleClickIconEye)
        fireEvent.click(iconEye)

        expect(handleClickIconEye).toHaveBeenCalled()
        const proof = await screen.getAllByText('Justificatif')
        expect(proof).toBeDefined()
        expect($.fn.modal).toHaveBeenCalled()

      })
    })
    describe("Test Class method computedBills()", () => {
      it("should return bills with date not formatted when corrupted data is introduced", () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
          const store = mockStore
          const bill = new Bills({
            document, onNavigate, store, bills, localStorage: window.localStorage
        })
    
        const result = bill.computedBills(fakeDateBills)
        expect(result[0].date).toEqual('fake')
      })
      it("should return bills with date properly formatted when not corrupted data is introduced", () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
          const store = mockStore
          const bill = new Bills({
            document, onNavigate, store, bills, localStorage: window.localStorage
        })
    
        const result = bill.computedBills([bills[0]])
        expect(result[0].date).toEqual(formatDate(bills[0].date))
      })
      it("should return filtered bills without status equal to null", () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
          const store = mockStore
          const bill = new Bills({
            document, onNavigate, store, bills, localStorage: window.localStorage
        })
    
        const result = bill.computedBills(nullStatusBills)
        expect(result).toEqual(nullStatusBills.filter(bill.byStatusNotNull))
      })
    })  
  })
})

describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills")
    Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
    )
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.appendChild(root)
    router()
  })
  afterEach(() => document.body.innerHTML = "")
  test("fetches bills from an API and fails with 404 message error", async () => {

    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 404"))
        }
      }})
    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test("fetches bills from an API and fails with 500 message error", async () => {

    mockStore.bills.mockImplementationOnce(() => {
      return {
        list : () =>  {
          return Promise.reject(new Error("Erreur 500"))
        }
      }})

    window.onNavigate(ROUTES_PATH.Bills)
    await new Promise(process.nextTick);
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})