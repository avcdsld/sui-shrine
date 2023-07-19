module sui_shrine::sui_shrine {
    use sui::tx_context::{TxContext, sender, epoch_timestamp_ms};
    use sui::object::{Self, UID, ID};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::sui::SUI;
    use sui::transfer;
    use sui::package;
    use sui::display;
    use std::string::{String, utf8};
    use std::ascii;
    use std::type_name;
    use std::option::{Self, Option};

    const EZeroAmount: u64 = 0;
    const ETooEarly: u64 = 1;
    const EAlreadyRetired: u64 = 2;

    struct OfferingBox<phantom T> has key {
        id: UID,
        offering: Balance<T>,
    }

    struct Amulet has key, store {
        id: UID,
        creation_epoch_timestamp_ms: u64,
    }

    struct Priest has key {
        id: UID,
        birth_epoch_timestamp_ms: u64,
        generation: u64,
        successor: Option<ID>,
    }

    struct FounderCapability has key {
        id: UID,
    }

    struct SUI_SHRINE has drop {}

    // ===== Events =====

    struct Pray has copy, drop {
        worshipper: address,
        prayer: String,
        offering_amount: u64,
        offering_type: ascii::String,
    }

    // ===== Initializer =====

    #[allow(unused_function,unused_variable)]
    fun init(otw: SUI_SHRINE, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);

        transfer::share_object(OfferingBox<SUI> {
            id: object::new(ctx),
            offering: coin::into_balance(coin::zero<SUI>(ctx))
        });

        transfer::share_object(Priest {
            id: object::new(ctx),
            birth_epoch_timestamp_ms: epoch_timestamp_ms(ctx),
            generation: 0,
            successor: option::none()
        });

        transfer::transfer(
            FounderCapability { id: object::new(ctx) },
            sender(ctx)
        );

        let keys = vector[
            utf8(b"name"),
            utf8(b"description"),
            utf8(b"image_url"),
            utf8(b"created_at"),
        ];
        let values = vector[
            utf8(b"Sui Shrine Amulet"),
            utf8(b"This is an amulet given by Sui Shrine."),
            utf8(b"ipfs://QmShsAyY6EyPDhST4WuGZbNUqvjH5CwHZzbdunHLbQzq2m"),
            utf8(b"{creation_epoch_timestamp_ms}"),
        ];
        let display = display::new_with_fields<Amulet>(&publisher,keys, values, ctx);
        display::update_version(&mut display);
        transfer::public_transfer(display, sender(ctx));

        transfer::public_transfer(publisher, sender(ctx));
    }

    // ===== Entrypoints =====

    public entry fun pray<T>(_: &mut Priest, offeringBox: &mut OfferingBox<T>, offering: Coin<T>, prayer: String, ctx: &mut TxContext) {
        // assert!(priest.successor == option::none(), EAlreadyRetired);

        let offering_amount = coin::value(&offering);
        assert!(offering_amount > 0, EZeroAmount);

        let offering_balance = coin::into_balance(offering);
        balance::join(&mut offeringBox.offering, offering_balance);

        event::emit(Pray {
            worshipper: sender(ctx),
            prayer: prayer,
            offering_amount: offering_amount,
            offering_type: type_name::into_string(type_name::get<T>()),
        });
    }

    public entry fun receive_amulet<T>(offeringBox: &mut OfferingBox<T>, offering: Coin<T>, ctx: &mut TxContext) {
        let offering_amount = coin::value(&offering);
        assert!(offering_amount > 0, EZeroAmount);

        let offering_balance = coin::into_balance(offering);
        balance::join(&mut offeringBox.offering, offering_balance);

        let amulet = Amulet { id: object::new(ctx), creation_epoch_timestamp_ms: epoch_timestamp_ms(ctx) };
        transfer::public_transfer(amulet, sender(ctx));
    }

    public entry fun burn_amulet(amulet: Amulet, _ctx: &mut TxContext) {
        let Amulet { id, creation_epoch_timestamp_ms: _ } = amulet;
        object::delete(id)
    }

    public entry fun create_offering_box<T>(_: &mut FounderCapability, ctx: &mut TxContext) {
        transfer::share_object(OfferingBox<T> {
            id: object::new(ctx),
            offering: coin::into_balance(coin::zero<T>(ctx))
        });
    }

    public entry fun withdraw<T>(_: &mut FounderCapability, offeringBox: &mut OfferingBox<T>, ctx: &mut TxContext) {
        let total = balance::value(&offeringBox.offering);
        let offering = coin::take(&mut offeringBox.offering, total, ctx);
        transfer::public_transfer(offering, sender(ctx))
    }

    public entry fun removal_priest(priest: &mut Priest, ctx: &mut TxContext) {
        let now = epoch_timestamp_ms(ctx);
        assert!(now - priest.birth_epoch_timestamp_ms > (1000*60*60*24*30), ETooEarly);
        assert!(priest.successor == option::none(), EAlreadyRetired);
        let new_priest = Priest {
            id: object::new(ctx),
            birth_epoch_timestamp_ms: now,
            generation: priest.generation + 1,
            successor: option::none()
        };
        priest.successor = option::some(object::uid_to_inner(&new_priest.id));
        transfer::share_object(new_priest)
    }

    // ===== Tests =====

    #[test_only]
    struct USDC_TEST has drop {}

    #[test]
    fun test_worship() {
        use sui::test_scenario;
        use sui::coin::{mint_for_testing};
        use sui::sui::SUI;
        use std::string;

        let admin = @0xA;
        let user = @0xB;

        let scenario_val = test_scenario::begin(admin);
        let scenario = &mut scenario_val;
        {
            init(SUI_SHRINE {}, test_scenario::ctx(scenario));
        };

        // pray with SUI
        test_scenario::next_tx(scenario, user);
        {
            let priest = test_scenario::take_shared<Priest>(scenario);
            let offeringBoxSUI = test_scenario::take_shared<OfferingBox<SUI>>(scenario);
            let offeringSUI = mint_for_testing<SUI>(10, test_scenario::ctx(scenario));
            pray<SUI>(
                &mut priest,
                &mut offeringBoxSUI,
                offeringSUI,
                string::utf8(b"my_wish"),
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(priest);
            test_scenario::return_shared(offeringBoxSUI);
        };

        // create_offering_box for USDC
        test_scenario::next_tx(scenario, admin);
        {
            let founderCapability = test_scenario::take_from_sender<FounderCapability>(scenario);
            create_offering_box<USDC_TEST>(&mut founderCapability, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, founderCapability);
        };

        // pray with USDC
        test_scenario::next_tx(scenario, user);
        {
            let priest = test_scenario::take_shared<Priest>(scenario);
            let offeringBoxUSDC = test_scenario::take_shared<OfferingBox<USDC_TEST>>(scenario);
            let offeringUSDC = mint_for_testing<USDC_TEST>(10, test_scenario::ctx(scenario));
            pray<USDC_TEST>(
                &mut priest,
                &mut offeringBoxUSDC,
                offeringUSDC,
                string::utf8(b"my_wish"),
                test_scenario::ctx(scenario)
            );
            test_scenario::return_shared(priest);
            test_scenario::return_shared(offeringBoxUSDC);
        };

        // withdraw
        test_scenario::next_tx(scenario, admin);
        {
            let founderCapability = test_scenario::take_from_sender<FounderCapability>(scenario);
            let offeringBoxUSDC = test_scenario::take_shared<OfferingBox<USDC_TEST>>(scenario);
            withdraw<USDC_TEST>(&mut founderCapability, &mut offeringBoxUSDC, test_scenario::ctx(scenario));
            test_scenario::return_to_sender(scenario, founderCapability);
            test_scenario::return_shared(offeringBoxUSDC);
        };

        test_scenario::end(scenario_val);
    }
}
